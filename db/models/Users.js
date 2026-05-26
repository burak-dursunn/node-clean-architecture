const mongoose = require('mongoose');
const is = require('is-js');
const CustomError = require('../../lib/Error');
const { HTTP_CODES } = require('../../config/Enum');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    first_name: String,
    last_name: String,
    phone_number: String,
    // single-session architecture
    token_version: { type: Number, default: 0 }
}, {
    versionKey: false,
    //? timestamps: true,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})

class Users extends mongoose.Model {
    //? Static Method
    static findByEmail(email) {
        return this.findOne({ email });
    }
    //? Static Factory Method
    static async createUser(data, session) {
        return this.create([data], { session });
    }

    async validPassword(password) {
        return bcrypt.compare(password, this.password);
    }

    static validateFieldsBeforeAuth(email, password) {
        if (typeof password !== 'string' || password.length <= 0)
            throw new CustomError(HTTP_CODES.UNAUTHORIZED, "Validation Error: ", "email or password is wrong")

        return null
    }
}

userSchema.loadClass(Users);
module.exports = mongoose.model("users", userSchema);
