const express = require('express');
const router = express.Router();
const Addresses = require('../db/models/Addresses');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');

router.use(auth.authenticate());

// GET user's addresses
router.get('/', async (req, res) => {
    try {
        let addresses = await Addresses.find({ user_id: req.user.id });
        res.json(Response.successResponse(addresses));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Addresses", procType: "Get List", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST add address
router.post('/add', async (req, res) => {
    let body = req.body;
    try {
        if (!body.title) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"title" field is required');
        if (!body.city) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"city" field is required');
        if (!body.full_address) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"full_address" field is required');

        let address = new Addresses({
            user_id: req.user.id,
            title: body.title,
            city: body.city,
            district: body.district || "",
            full_address: body.full_address
        });

        await address.save();

        logger.info({ email: req.user.email, location: "Addresses", procType: "Add", log: { address_id: address._id } });
        res.json(Response.successResponse({ success: true, address }));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Addresses", procType: "Add", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// DELETE remove address
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleting = await Addresses.findOneAndDelete({ _id: id, user_id: req.user.id });

        if (!deleting) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "The address you want to delete could not be found.");
        }

        logger.info({ email: req.user.email, location: "Addresses", procType: "Delete", log: { id: id } });
        res.json(Response.successResponse({
            success: true,
            message: `Address deleted successfully.`
        }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router;
