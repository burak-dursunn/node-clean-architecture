var express = require('express');
var router = express.Router();
const Categories = require('../db/models/Categories')
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');

// GET categories listing
router.get('/', async(req, res) => {
    try {
        let categories = await Categories.find({});

        res.json(Response.succesResponse(categories));
    } catch (error) {
        let errorResponse = Response.errorResponse(err);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
        
    }
})


router.post('/add', async(req, res) => {
    let body = req.body;

    try {
        if(!body.name) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:",'"name" area must be filled');

        let category = new Categories({
            name: body.name,
            is_active: true,
            created_by: req.user?.id
        })

        await category.save();

        res.json(Response.successResponse({success: true}))
    } catch (error){
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code || httpCodes.INT_SERVER_ERROR).json(errorResponse);
    }

})

router.put('/update', async (req, res) => {
    let body = req.body;
    try {
        if (!body._id) throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error:", '"_id" area must be filled.');
        let allowedUpdates = ["name"]; //* WhiteList
        let updates = { };

        let counter = 0;
        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[counter] = body[key];
                counter++;
            }
        });
        
        if( typeof body.is_active === 'boolean') updates.is_active = body.is_active;

        await Categories.updateOne({_id: body._id}, updates);

        res.json(Response.successResponse({ success: true }));
        
    } catch (error) { 
        let errorResponse = Response.errorResponse(error);
        res.status(errorResponse.code).json(errorResponse);
        
    }
})


router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleting = await Categories.findByIdAndDelete(id);
        
        if (!deleting) {
            throw new CustomError(Enum.HTTP_CODES.NOT_FOUND, "Not Found", "Silinmek istenen kategori bulunamadı.");
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