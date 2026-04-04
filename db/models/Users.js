const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_active: { type: Boolean, default: true },
    first_name: String,
    last_name: String,
    phone_number: String
}, {
    versionKey: false,
    //? timestamps: true,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})

class Users extends mongoose.Model {

}

userSchema.loadClass(Users);
module.exports = mongoose.model("users", userSchema);
