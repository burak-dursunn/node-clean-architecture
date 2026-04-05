var express = require('express');
var router = express.Router();
const Users = require('../db/models/Users');
const bcrypt = require('bcryptjs');
const is = require('is-js');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const Enum = require('../config/Enum');
const Roles = require('../db/models/Roles');
const UserRoles = require('../db/models/UserRoles');
const httpCodes = Enum.HTTP_CODES;

/* GET users listing. */
router.get('/', async (req, res) => {
  try {
    const users = await Users.find();
    
    res.json(Response.successResponse);

  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
  
});


router.post('/add', async (req, res) => {
  try {
    const { body } = req;

    if(!body.email) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"email" field must be filled');
    if(is.not.email(body.email)) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error', '"email" field must be in email format');
    if(!body.password) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"password" field must be filled');
    
    let hashedPassword = bcrypt.hash(body.password, 8); 

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
    const errorResponse = Response.errorResponse(error);
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
    const errorResponse = Response.errorResponse(error);
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
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse.message);
  }
})

//! Only at the beginning
router.post('/first-register', async (req, res) => {
  try {
    const body = req.body;
    if (!body) throw new CustomError(httpCodes.BAD_REQUEST, "validation Error:", "There is no 'body'");

    const existingUser = await Users.findOne({});
    
    if (existingUser) 
      throw new CustomError(httpCodes.NOT_FOUND, 'Existing User:','Existing User detected!')

    if(!body.email) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"email" field must be filled');
    //if(is.not.email(body.email)) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error', '"email" field must be in email format');
    if(!body.password) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"password" field must be filled');
    
    let hashedPassword = await bcrypt.hash(body.password, 8);

    //todo Create a session in order to start a transaction
    const createdUser = await Users.create({
      email: body.email,
      password: hashedPassword,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });

    //todo format the code according to "seeding" method.
    const role = await Roles.create({
      role_name: Enum.SUPER_ADMIN,
      is_active: true,
      created_by: createdUser._id
    })

    const userRoles = await UserRoles.create({
      role_id: role._id,
      role_name: role.role_name,
      user_id: createdUser._id,
      user_name: `${createdUser.first_name} ${createdUser.last_name}`
    })
    
    res.status(httpCodes.CREATED).json(Response.successResponse({ success: true}, httpCodes.CREATED));

  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})
module.exports = router;
