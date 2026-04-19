const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Users = require('../../db/models/users.model');
const Roles = require('../../db/models/roles.model');
const UserRoles = require('../../db/models/userRoles.model');

class AuthService {
  static async firstRegister(body) {
    if (!body)
      throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error", "Body is required");

    if (!body.email)
      throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error", "Email is required");

    if (!body.password)
      throw new CustomError(httpCodes.BAD_REQUEST, "Validation Error", "Password is required");

    // 🔴 race condition risk decreased. (unique zaten var ama yine de kontrol ediyoruz)
    const existingUser = await Users.findOne({});
    if (existingUser)
      throw new CustomError(httpCodes.CONFLICT, "Existing User", "User already exists");

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const user = await Users.create([{
        email: body.email,
        password: hashedPassword,
        is_active: true,
        first_name: body.first_name,
        last_name: body.last_name,
        phone_number: body.phone_number
      }], { session });

      const createdUser = user[0];

      const role = await Roles.create([{
        role_name: Enum.SUPER_ADMIN,
        is_active: true,
        created_by: createdUser._id
      }], { session });

      const createdRole = role[0];

      await UserRoles.create([{
        role_id: createdRole._id,
        role_name: createdRole.role_name,
        user_id: createdUser._id,
        user_name: `${createdUser.first_name} ${createdUser.last_name}`
      }], { session });

      await session.commitTransaction();

      return { success: true };

    } catch (error) {
        await session.abortTransaction();
        throw error;

    } finally {
        session.endSession();
    }
  }
}

module.exports = AuthService;