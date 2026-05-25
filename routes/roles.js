/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Roles = require('../db/models/Roles');
const RolePrivileges = require('../db/models/RolePrivileges');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const role_privileges = require('../config/role_privileges');
const auth = require('../lib/auth');
const logger = require('../lib/logger/loggerClass');

/**
 * withTransaction — environment-aware transaction helper.
 *
 * Production (replica set / Atlas): full ACID session transaction.
 * Local / standalone MongoDB: falls back to direct execution without a
 * session so development stays unblocked while production stays safe.
 *
 * @param {Function} fn  async (session | null) => void
 */
async function withTransaction(fn) {
    let session = null;
    try {
        session = await mongoose.startSession();
        await session.startTransaction();
        await fn(session);
        await session.commitTransaction();
    } catch (err) {
        // MongoServerError code 20 → "Transaction numbers are only allowed…"
        // This means the server is a standalone node (no replica set).
        if (err.code === 20 || err.codeName === 'IllegalOperation') {
            if (session) {
                try { await session.abortTransaction(); } catch (_) { /* ignore */ }
                session.endSession();
                session = null;
            }
            // Retry without a session — acceptable for local/dev environments
            await fn(null);
            return;
        }
        if (session) {
            try { await session.abortTransaction(); } catch (_) { /* ignore */ }
        }
        throw err;
    } finally {
        if (session) session.endSession();
    }
}

router.get('/role_privileges', async (req, res) => {
    res.json(role_privileges);
})

//! Authentication Middleware
router.all('*', auth.authenticate(), (req, res, next) => {
    next();
});

router.get('/', auth.checkPrivilege('role_view'), async (req, res) => {
    try {
        const roles = await Roles.find();

        logger.info({ email: req.user.email, location: 'Roles', procType: 'Get List', log: `${roles.length} roles fetched` });
        res.json(Response.successResponse(roles));

    } catch (err) {
        logger.error({ email: req.user?.email, location: 'Roles', procType: 'Get List', log: err.message });
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})


router.post('/add', auth.checkPrivilege('role_add'), async (req, res) => {
    const body = req.body;
    try {
        if (!body.role_name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error!", '"role_name" area must be filled');
        if (!body.permissions || !Array.isArray(body.permissions)) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error!", '"permissions" field must be an array or must be filled');
        }

        const role = new Roles({
            role_name: body.role_name,
            is_active: body.is_active,
            created_by: req.user.id
        });

        const privilegesData = body.permissions.map(permissionKey => ({
            role_id: role._id,
            permission: permissionKey,
            created_by: req.user.id
        }));

        //! Transaction: full ACID on replica-set/Atlas, graceful fallback on standalone
        await withTransaction(async (session) => {
            await role.save(session ? { session } : {});
            await RolePrivileges.insertMany(privilegesData, session
                ? { ordered: false, session }
                : { ordered: false });
        });

        logger.info({ email: req.user.email, location: 'Roles', procType: 'Add', log: { roleName: body.role_name } });
        res.json(Response.successResponse({ role }));

    } catch (err) {
        logger.error({ email: req.user?.email, location: 'Roles', procType: 'Add', log: err.message });
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.patch('/update/:id', auth.checkPrivilege('role_update'), async (req, res) => { // partial update
    const body = req.body;
    const { id } = req.params;
    try {

        if (!id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "_id area must be filled");
        const allowedUpdates = ["role_name", "is_active"];
        let updates = {};

        for (const key of Object.keys(body)) {
            if (allowedUpdates.includes(key)) {
                // for...of kullandığımız için continue burada sorunsuz çalışır
                if (key == 'is_active' && typeof body[key] !== 'boolean') continue;

                updates[key] = body[key];
            }
        }


        if (body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {
            let existingPrivileges = await RolePrivileges.find({ role_id: id });
            let existingPermissionsList = existingPrivileges.map(p => p.permission);

            //!
            let removedPermissions = existingPermissionsList.filter(perm => !body.permissions.includes(perm));
            let newPermissions = body.permissions.filter(perm => !existingPermissionsList.includes(perm));

            if (removedPermissions.length > 0) {
                await RolePrivileges.deleteMany({
                    role_id: id,
                    permission: { $in: removedPermissions }
                })
            }

            if (newPermissions.length > 0) {
                let privilegesData = newPermissions.map(permissionKey => ({ //? map is a senchron function
                    role_id: id,
                    permission: permissionKey,
                    created_by: req.user.id
                }));

                await RolePrivileges.insertMany(privilegesData, { ordered: false });
            }
        }

        if (Object.keys(updates).length === 0 && !body.permissions) {
            return res.json({
                success: false,
                message: 'There are no fields for update'
            })
        }

        let updatedRole = {};
        if (Object.keys(updates).length > 0) {
            updatedRole = await Roles.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true
            });
        }

        logger.info({ email: req.user.email, location: 'Roles', procType: 'Update', log: { roleId: id, updates: Object.keys(updates) } });
        res.json(Response.successResponse(updatedRole));

    } catch (err) {
        logger.error({ email: req.user?.email, location: 'Roles', procType: 'Update', log: err.message });
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.delete('/delete/:id', auth.checkPrivilege('role_delete'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "_id area must be filled on the params");
        }

        const deletedRole = await Roles.findByIdAndDelete(id); //? returns json data-type

        if (!deletedRole) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "The user that you want to delete could not be found with the given ID");
        }

        const deletedPermissions = await RolePrivileges.deleteMany({ role_id: id });
        //? deleteMany function returns an object containing the count of deleted documents.
        //? on the other hand, findByIdAndDelete returns the information of deleted item as a json

        logger.info({ email: req.user.email, location: 'Roles', procType: 'Delete', log: { deletedRoleId: id, deletedRole: deletedRole.role_name } });
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        logger.error({ email: req.user?.email, location: 'Roles', procType: 'Delete', log: error.message });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }

})
module.exports = router;