const express = require('express');
const router = express.Router();
const Roles = require('../db/models/Roles');
const RolePrivileges = require('../db/models/RolePriviliges');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;

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

        if (!body.role_name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "role_name area must be filled");

        const role = new Role({
            role_name: body.role_name,
            is_active: body.is_active,
            created_by: req.user?.id //! attribute is defined like this for now
        })

        await role.save();

        res.json(Response.successResponse);

    } catch (err) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code).json(errorResponse);
    }
})

router.patch('/update', async (req, res) => { // partial update
    const body = req.body;
    try {

        if (!body._id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error: ", "_id area must be filled");
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

        if(Object.keys(updates).length === 0) {
            return res.json({
                success: false,
                message: 'There are no fields for update'
            })
        }

        await Roles.findByIdAndUpdate(body._id , updates);

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
        
        res.json(Response.successResponse({ success: true}));
        
    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
})