const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'categories' },
    images: [{ type: String }],
    is_active: { type: Boolean, default: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'users' }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Products extends mongoose.Model {
}

schema.loadClass(Products);
module.exports = mongoose.model("products", schema);
