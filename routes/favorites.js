const express = require('express');
const router = express.Router();
const Favorites = require('../db/models/Favorites');
const Products = require('../db/models/Products');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const logger = require('../lib/logger/loggerClass');
const auth = require('../lib/auth');

router.use(auth.authenticate());

// GET user's favorites
router.get('/', async (req, res) => {
    try {
        let favorites = await Favorites.find({ user_id: req.user.id }).populate('product_id', 'name price images');
        res.json(Response.successResponse(favorites));
    } catch (error) {
        logger.error({ email: req.user?.email, location: "Favorites", procType: "Get List", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

// POST toggle favorite (add or remove)
router.post('/toggle', async (req, res) => {
    let { product_id } = req.body;

    try {
        if (!product_id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"product_id" field is required');

        const product = await Products.findById(product_id);
        if (!product) {
            throw new CustomError(httpCodes.NOT_FOUND, "Not Found:", 'Product not found');
        }

        const existingFavorite = await Favorites.findOne({ user_id: req.user.id, product_id: product_id });

        if (existingFavorite) {
            // Remove from favorites
            await Favorites.findByIdAndDelete(existingFavorite._id);
            res.json(Response.successResponse({ success: true, message: "Removed from favorites", is_favorite: false }));
        } else {
            // Add to favorites
            const newFavorite = new Favorites({ user_id: req.user.id, product_id: product_id });
            await newFavorite.save();
            res.json(Response.successResponse({ success: true, message: "Added to favorites", is_favorite: true }));
        }

    } catch (error) {
        logger.error({ email: req.user?.email, location: "Favorites", procType: "Toggle", log: error });
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }
});

module.exports = router;
