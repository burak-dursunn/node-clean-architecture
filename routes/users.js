/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Users = require('../db/models/Users');
const Roles = require('../db/models/Roles');
const UserRoles = require('../db/models/UserRoles');
const AuthService = require('../modules/auth/auth.service');

const AuditLogs = require('../lib/auditLogs');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const is = require('is-js');
const Response = require('../lib/Response');
const CustomError = require('../lib/Error');
const config = require('../config');
const Enum = require('../config/Enum');
const httpCodes = Enum.HTTP_CODES;
const auth = require('../lib/auth');
const logger = require('../lib/logger/loggerClass');

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

router.post("/auth", async (req, res) => {
  try {

    let { email, password } = req.body;

    Users.validateFieldsBeforeAuth(email, password);

    let user = await Users.findOne({ email });

    if (!user) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Email or password is wrong");

    if (!await user.validPassword(password)) throw new CustomError(Enum.HTTP_CODES.UNAUTHORIZED, "Validation Error", "Email or password is wrong");

    let payload = {
      id: user._id,
      exp: parseInt(Date.now() / 1000) + config.JWT.EXPIRE_TIME
    }

    let token = jwt.encode(payload, config.JWT.SECRET);

    let userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name
    }

    logger.info({ email: user.email, location: 'Users', procType: 'Auth', log: 'Login successful' });
    res.json(Response.successResponse({ token, user: userData }));

  } catch (err) {
    logger.warn({ email: req.body?.email || 'unknown', location: 'Users', procType: 'Auth', log: err.message });
    let errorResponse = Response.errorResponse(err);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.all('*', auth.authenticate(), (req, res, next) => {
  next();
})

/* GET users listing. */
router.get('/', async (req, res) => {
  try {
    const users = await Users.find();

    logger.info({ email: req.user.email, location: 'Users', procType: 'Get List', log: `${users.length} users fetched` });
    res.json(Response.successResponse(users));

  } catch (error) {
    logger.error({ email: req.user?.email, location: 'Users', procType: 'Get List', log: error.message });
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
});

router.post('/add', async (req, res) => {
  try {
    const { body } = req;

    if (!body.email) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', '"email" field must be filled');
    if (!body.password) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', '"password" field must be filled');
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length == 0) {
      throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', 'You must give roles space in the body');
    }

    let hashedPassword = await bcrypt.hash(body.password, 10);

    const roles = await Roles.find({ _id: { $in: body.roles } });

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

    logger.info({ email: req.user.email, location: 'Users', procType: 'Add', log: { userId: user._id, email: user.email } });

    for (let i = 0; i < roles.length; i++) {
      await UserRoles.create({
        role_id: roles[i]._id,
        user_id: user._id
      })
    }

    res.status(httpCodes.CREATED).json(Response.successResponse({ success: true }, httpCodes.CREATED));

  } catch (error) {
    logger.error({ email: req.user?.email, location: 'Users', procType: 'Add', log: error.message });
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    let updates = {};

    if (!id) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', 'You must give a "id" information');

    if (body.password && body.password.length > Enum.PASS_LENGTH) {
      updates.password = await bcrypt.hash(body.password, 10);
    }

    if (body.first_name) updates.first_name = body.first_name;
    if (body.last_name) updates.last_name = body.last_name;
    if (body.phone_number) updates.phone_number = body.phone_number;

    let removedRoles = [];
    let newRoles = [];
    if (body.roles && Array.isArray(body.roles) && body.roles.length > 0) {
      let rolOfUsers = await UserRoles.find({ user_id: id });
      rolOfUsers = rolOfUsers.map(r => r.role_id.toString());
      body.roles = body.roles.map(r => r.toString());

      removedRoles = rolOfUsers.filter(x => !body.roles.includes(x));
      newRoles = body.roles.filter(x => !rolOfUsers.includes(x));
    }

    if (removedRoles.length > 0) {
      await UserRoles.deleteMany({
        user_id: id,
        role_id: { $in: removedRoles }
      });
    }

    if (newRoles.length > 0) {
      let newUserRoles = newRoles.map(r => ({
        role_id: r,
        user_id: id,
      }))

      await UserRoles.insertMany(newUserRoles, { ordered: false });
    }

    await Users.updateOne({ _id: id }, updates);

    logger.info({ email: req.user.email, location: 'Users', procType: 'Update', log: { targetUserId: id, updates: Object.keys(updates) } });
    res.json(Response.successResponse({ success: true }));

  } catch (error) {
    logger.error({ email: req.user?.email, location: 'Users', procType: 'Update', log: error.message });
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})

router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params

    const deletedData = await Users.findByIdAndDelete(id);

    if (!deletedData) throw new CustomError(httpCodes.BAD_REQUEST, 'Validation Error:', 'You must give a valid "id"');

    logger.info({ email: req.user.email, location: 'Users', procType: 'Delete', log: { deletedUserId: id } });
    res.json(Response.successResponse({
      success: true,
      data: deletedData,
      message: "User has been succesfully deleted."
    }))

  } catch (error) {
    logger.error({ email: req.user?.email, location: 'Users', procType: 'Delete', log: error.message });
    const errorResponse = Response.errorResponse(error);
    res.status(errorResponse.code).json(errorResponse);
  }
})
module.exports = router;
