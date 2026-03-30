const express = require('express');
const router = express.Router();
const Roles = require('../db/models/Roles');
const RolePrivileges = require('../db/models/RolePriviliges');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const role_privileges = require('../config/role_privileges');

router.get('/', async (req, res) => {
    try {
        const role = await Role.find();

        res.json(Response.successResponse({ success: true }));

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})


router.post('/add', async (req, res) => {
    const body = req.body;
    try {
        if (!body.role_name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error!", "role_name area must be filled");
        if (!body.permissions && !Array.isArray(body.permissions)) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error!", '"permission" field must be filled');
        };

        const role = new Role({
            role_name: body.role_name,
            is_active: body.is_active,
            created_by: req.user?.id //! attribute is defined like this for now
        })

        await role.save();

        // for (let i = 0; i<body.permissions.lenght; i++) {
        //     let priv = new RolePrivileges({
        //         role_id: role._id,
        //         permission: body.permissions[i],
        //         created_by: req.user?.id
        //     })

        //     await priv.save();
        // }

        const privilegesData = body.permissions.map(permissionKey => {
            return {
                role_id: role_id,
                permission: permissionKey,
                created_by: req.user?.id
            }
        })

        await RolePrivileges.insertMany(privilegesData,{ ordered: false});

        res.json(Response.successResponse);

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.patch('/update/:id', async (req, res) => { // partial update
    const body = req.body;
    const { id } = req.params;
    try {

        if (!id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "_id area must be filled");
        const allowedUpdates = ["role_name", "is_active"];
        let updates = {};

        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                if (key == 'is_active' && typeof body[key] !== 'boolean') {
                    return;
                }

                updates[key] = body[key];
            }
        })


        if (body.permission && Array.isArray(body.permission) && body.permission.length > 0) {
            let existingPrivileges = await RolePrivileges.find({role_id: id});
            let existinPermissionsList = existingPrivileges.map(p => p.permission);

            //!
            let removedPermissions = existinPermissionsList.filter(perm => !body.permission.includes(perm));
            let newPermissions = body.permission.filter(perm => !existinPermissionsList.includes(perm));

            if (removedPermissions.length > 0) {
                await RolePrivileges.deleteMany({
                    role_id: id,
                    permission: { $in: removedPermissions}
                })
            }

            if (newPermissions.length > 0) {
                let privilegesData = newPermissions.map(permissionKey => ({ //? map is a senchron function
                    role_id: id,
                    permission: permissionKey,
                    created_by: req.user?.id
                }));

                await RolePrivileges.insertMany(privilegesData,{ ordered: false});
            }
        }

        if (Object.keys(updates).length === 0 && !body.permission) {
                return res.json({
                    success: false,
                    message: 'There are no fields for update'
                })
            }

        if (Object.keys(updates).length > 0) {
            await Roles.findByIdAndUpdate(id, updates, {
                new: true,
                runValidators: true
            }); 
        }

        res.json(Response.successResponse);

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "_id area must be filled on the params");
        }

        const deletedRole = await Roles.findByIdAndDelete(id); //? returns json data-type

        if (!deletedRole) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "The user that you want to delete could not be found with the given ID");
        }

        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})