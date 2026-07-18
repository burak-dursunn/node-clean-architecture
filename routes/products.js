const express = require('express');
const router = express.Router();
const Products = require('../db/models/Products');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');
const emitter = require('../lib/Emitter');

// GET products listing (Public)
router.get('/', async (req, res) => {
    try {
        let products = await Products.find({}).populate('category_id', 'name');
        res.json(Response.successResponse(products));
    } catch (error) {
        logger.error({ email: req.user?.email || 'guest', location: "Products", procType: "Get List", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// All routes below require authentication
router.use(auth.authenticate());

router.post('/add', auth.checkPrivilege('product_add'), async (req, res) => {
    let body = req.body;
    try {
        if (!body.name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"name" field must be filled');
        if (!body.price) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"price" field must be filled');

        let product = new Products({
            name: body.name,
            description: body.description,
            price: body.price,
            stock: body.stock || 0,
            category_id: body.category_id,
            images: body.images || [],
            is_active: body.is_active !== undefined ? body.is_active : true,
            created_by: req.user.id
        });

        await product.save();

        logger.info({ email: req.user.email, location: "Products", procType: "Add", log: { product } });
        emitter.getEmitter('notifications').emit('messages', { messages: product.name + " added to products" });

        res.json(Response.successResponse({ success: true, product }));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Products", procType: "Add", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

router.put('/update/:id', auth.checkPrivilege('product_update'), async (req, res) => {
    let body = req.body;
    try {
        const { id } = req.params;
        if (!id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"id" param must be provided.');
        let allowedUpdates = ["name", "description", "price", "stock", "category_id", "images", "is_active"];
        let updates = {};

        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = body[key];
            }
        });

        await Products.updateOne({ _id: id }, updates);

        logger.info({ email: req.user.email, location: "Products", procType: "Update", log: { id: id, updates } });
        res.json(Response.successResponse({ success: true }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

router.delete('/delete/:id', auth.checkPrivilege('product_delete'), async (req, res) => {
    try {
        const { id } = req.params;
        const deleting = await Products.findByIdAndDelete(id);

        if (!deleting) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "The product you want to delete could not be found.");
        }

        logger.info({ email: req.user.email, location: "Products", procType: "Delete", log: { id: id } });
        emitter.getEmitter('notifications').emit('messages', { messages: `${deleting.name} has been deleted successfully.` });
        res.json(Response.successResponse({
            success: true,
            message: `${deleting.name} has been deleted successfully.`
        }));

    } catch (error) {
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
    }
});

module.exports = router;
