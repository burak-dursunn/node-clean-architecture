var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const Users = require('../db/models/Users');
const AuthService = require('../modules/auth/auth.service');
const AuditLogs = require('../lib/auditLogs');
const bcrypt = require('bcrypt');
const is = require('is-js');
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
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
  
});


router.post('/add', async (req, res) => {
  try {
    const { body } = req;

    if(!body.email) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"email" field must be filled');
    //if(is.not.email(body.email)) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error', '"email" field must be in email format');
    if(!body.password) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','"password" field must be filled');
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', 'You must give roles space in the body');
    }
    
    let hashedPassword = await bcrypt.hash(body.password, 8); 


    const roles = await Roles.find({ _id : { $in: body.roles}});

    if (roles.length == 0) {
      throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', 'You must give roles space in the body');
    }

    const user = await Users.create({
      email: body.email,
      password: hashedPassword,
      is_active: true,
      first_name: body.first_name,
      last_name: body.last_name,
      phone_number: body.phone_number
    });

    //todo 
    //todo AuditLogs.info(req.user?.email || "Burak Dursun", "Users", "Add", { user });

    for (let i = 0; i<roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id
      })
    }
    
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
    // const allowedUpdates;
    let updates = {};

    if (!id) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:','You must give a "id" information');

    if (body.password && body.password.length > Enum.PASS_LENGTH) {
      updates.password = await bcrypt.hash(body.password, 8);
    } 

    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    //todo get back and check here again
    let removedRoles = [];
    let newRoles =  [] ;
    if(body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
      let rolOfUsers = await UserRoles.find({ user_id: id});
      rolOfUsers = rolOfUsers.map(r => r.role_id.toString());
      body.roles = body.roles.map(r  => r.toString());

      let removedRoles = rolOfUsers.filter(x => !body.roles.includes(x));
      let newRoles = body.roles.filter(x => !rolOfUsers.includes(x));
    }

    if (removedRoles.length > 0) {
      await UserRoles.deleteMany({ 
        user_id: id, 
        role_id: { $in: removedRoles}});
    }

    if (newRoles.length > 0) {
      let newUserRoles = newRoles.map(r => ({
        role_id: r,
        user_id: id,
      }))

      await UserRoles.insertMany(newUserRoles, { ordered: false});
    }

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
    const result = await AuthService.firstRegister(req.body);

    res
      .status(httpCodes.CREATED)
      .json(Response.successResponse(result, httpCodes.CREATED));

  } catch (error) {
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})
module.exports = router;
