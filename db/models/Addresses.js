const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    title: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    full_address: { type: String, required: true }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Addresses extends mongoose.Model {
}

schema.loadClass(Addresses);
module.exports = mongoose.model("addresses", schema);
