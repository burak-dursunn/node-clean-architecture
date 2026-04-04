var express = require('express');
var router = express.Router();
const Users = require('../db/models/Users');
const bcrypt = require('bcrypt-nodejs');
const id = require('is-js');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;

/* GET users listing. */
router.get('/', async (req, res) => {
  try {
    const users = await Users.find();
    
    res.json(Response.successResponse);

  } catch (error) {
    const errorResponse = Response.errorResponse(users);
    res.status(errorResponse.code).json(errorResponse);
  }
  
});


router.post('/register', async (req, res) => {
  try {

    if(!body.email) throw new CustomError(httpCodes.CREATED, 'Validation Error:','"email" field must be filled');
    if(is.not.email(body.email)) new CustomError(httpCodes.FORBIDDEN, 'Validation Error', '"email" field must be in email format');
    if(!body.password) throw new CustomError(httpCodes.CREATED, 'Validation Error:','"password" field must be filled');
    
    let hashedPassword = bcrypt.hash(body.password, bcrypt.genSalt(8)); 

    await Users.create({
      email: body.email,
      hashedPassword,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });
    
    res.status(httpCodes.CREATED).json(Response.successResponse({ success: true}, httpCodes.CREATED));

  } catch (error) {
    const errorResponse = Response.errorResponse(users);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.put('/update/:id', async (req, res) => {
  try {
    const  { id } = req.params;
    const body = req.body;
    let updates = {};

    if (!id) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','You must give a "id" information');

    if (body.password && body.password.length > Enum.PASS_LENGTH) {
      updates.password = bycrpt.hash(body.password, bcrypt.genSalt(8));
    }

    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    await Users.updateOne({ _id : id}, updates);

    res.json(Response.successResponse({ success: true}));
    
  } catch (error) {
    const errorResponse = Response.errorResponse;
    res.status(errorResponse.code).json(errorResponse.message);
  }
})

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deletedData = await Users.findByIdAndDelete(id);

    if (!deletedData) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','You must give a valid "id"');

    res.json(Response.successResponse({
      success: true,
      data: deletedData,
      message: "User has been succesfully deleted."
    }))
    

  } catch (error) {
    const errorResponse = Response.errorResponse;
    res.status(errorResponse.code).json(errorResponse.message);
  }
})

module.exports = router;
