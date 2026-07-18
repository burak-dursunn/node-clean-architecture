const express = require('express');
const router = express.Router();
const Carts = require('../db/models/Carts');
const Products = require('../db/models/Products');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');

// All cart routes require authentication
router.use(auth.authenticate());

// GET user's cart
router.get('/', async (req, res) => {
    try {
        let cart = await Carts.findOne({ user_id: req.user.id }).populate('items.product_id', 'name price images');
        
        if (!cart) {
            cart = await Carts.create({ user_id: req.user.id, items: [] });
        }

        res.json(Response.successResponse(cart));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Carts", procType: "Get Cart", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST add item to cart
router.post('/add', async (req, res) => {
    let { product_id, quantity } = req.body;
    quantity = quantity || 1;

    try {
        if (!product_id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"product_id" field is required');

        const product = await Products.findById(product_id);
        if (!product || !product.is_active) {
            throw new CustomError(httpCodes.NOT_FOUND, "Not Found:", 'Product not found or inactive');
        }

        let cart = await Carts.findOne({ user_id: req.user.id });
        if (!cart) {
            cart = new Carts({ user_id: req.user.id, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.product_id.toString() === product_id);

        if (itemIndex > -1) {
            cart.items[itemIndex].quantity += quantity;
            cart.items[itemIndex].price = product.price; // Update to latest price
        } else {
            cart.items.push({ product_id, quantity, price: product.price });
        }

        await cart.save();
        cart = await cart.populate('items.product_id', 'name price images');

        res.json(Response.successResponse({ success: true, cart }));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Carts", procType: "Add Item", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST remove item from cart
router.post('/remove', async (req, res) => {
    let { product_id, quantity } = req.body;

    try {
        if (!product_id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"product_id" field is required');

        let cart = await Carts.findOne({ user_id: req.user.id });
        if (!cart) {
            throw new CustomError(httpCodes.NOT_FOUND, "Not Found:", 'Cart not found');
        }

        const itemIndex = cart.items.findIndex(item => item.product_id.toString() === product_id);

        if (itemIndex > -1) {
            if (quantity && cart.items[itemIndex].quantity > quantity) {
                cart.items[itemIndex].quantity -= quantity;
            } else {
                cart.items.splice(itemIndex, 1);
            }
            await cart.save();
        }

        cart = await cart.populate('items.product_id', 'name price images');
        res.json(Response.successResponse({ success: true, cart }));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Carts", procType: "Remove Item", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST clear cart
router.post('/clear', async (req, res) => {
    try {
        let cart = await Carts.findOne({ user_id: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        res.json(Response.successResponse({ success: true, cart }));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Carts", procType: "Clear Cart", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

module.exports = router;
