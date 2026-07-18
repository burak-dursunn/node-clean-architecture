const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Orders = require('../db/models/Orders');
const Carts = require('../db/models/Carts');
const Products = require('../db/models/Products');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');

router.use(auth.authenticate());

// GET user's orders
router.get('/', async (req, res) => {
    try {
        let orders = await Orders.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(Response.successResponse(orders));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Orders", procType: "Get List", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST create order from cart
router.post('/create', async (req, res) => {
    const { shipping_address } = req.body;
    
    // Create a database session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!shipping_address || !shipping_address.full_address) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", 'Shipping address is required');
        }

        // 1. Get user's cart
        const cart = await Carts.findOne({ user_id: req.user.id }).populate('items.product_id').session(session);
        
        if (!cart || cart.items.length === 0) {
            throw new CustomError(httpCodes.BAD_REQUEST, "Bad Request:", 'Your cart is empty');
        }

        let total_amount = 0;
        const orderItems = [];

        // 2. Validate stock and prepare order items
        for (let item of cart.items) {
            const product = item.product_id;
            
            if (!product || !product.is_active) {
                throw new CustomError(httpCodes.BAD_REQUEST, "Stock Error:", `Product unavailable`);
            }
            if (product.stock < item.quantity) {
                throw new CustomError(httpCodes.BAD_REQUEST, "Stock Error:", `Insufficient stock for ${product.name}`);
            }

            // Deduct stock
            product.stock -= item.quantity;
            await product.save({ session });

            // Add to order items
            orderItems.push({
                product_id: product._id,
                name: product.name,
                price: product.price, // use latest price
                quantity: item.quantity
            });
            
            total_amount += product.price * item.quantity;
        }

        // 3. Create the order
        const newOrder = new Orders({
            user_id: req.user.id,
            items: orderItems,
            total_amount: total_amount,
            shipping_address: shipping_address,
            status: 'PENDING',
            payment_status: 'UNPAID' // Assuming payment is handled later or mock
        });

        await newOrder.save({ session });

        // 4. Clear the cart
        cart.items = [];
        cart.total_amount = 0;
        await cart.save({ session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        logger.info({ email: req.user.email, location: "Orders", procType: "Create", log: { order_id: newOrder._id } });
        res.json(Response.successResponse({ success: true, order: newOrder }));

    } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        session.endSession();
        
        logger.error({ email: req.user?.email, location: "Orders", procType: "Create", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

module.exports = router;
