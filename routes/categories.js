const express = require('express');
const router = express.Router();
const Categories = require('../db/models/Categories')
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const AuditLogs = require('../lib/auditLogs');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');

// GET categories listing
router.get('/', auth.authenticate(), async (req, res) => {
    try {
        let categories = await Categories.find({});
        AuditLogs.info(req.user.email, "Categories", "Get List", "Getting Category List");
        logger.info({
            email: req.user?.email,
            location: "Categories",
            procType: "Get List",
            log: "Getting Category List"
        });

        res.json(Response.successResponse(categories));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Categories", procType: "Get List", log: error })

        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);

    }
})


router.post('/add', auth.authenticate(), async (req, res) => {
    let body = req.body;

    try {
        if (!body.name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"name" area must be filled');

        let category = new Categories({
            name: body.name,
            is_active: true,
            created_by: req.user.id
        })

        await category.save();

        //! Logging
        AuditLogs.info(req.user.email, "Categories", "Add", { category });
        logger.info({ email: req.user.email, location: "Categories", procType: "Add", log: { category } });

        res.json(Response.successResponse({ success: true }))
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Categories", procType: "Add", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }

})

router.put('/update/:id', auth.authenticate(), async (req, res) => {
    let body = req.body;
    try {
        const { id } = req.params;
        if (!id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"id" param must be provided.');
        let allowedUpdates = ["name"]; //* WhiteList
        let updates = {};

        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = body[key];
            }
        });

        if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

        await Categories.updateOne({ _id: id }, updates);

        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);

    }
})


router.delete('/delete/:id', auth.authenticate(), async (req, res) => {
    try {
        const { id } = req.params;
        const deleting = await Categories.findByIdAndDelete(id);

        if (!deleting) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "The category you want to delete could not be found.");
        }

        res.json(Response.successResponse({
            success: true,
            message: 'Category has been successfully deleted'
        }))


    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse)
    }
})

module.exports = router;