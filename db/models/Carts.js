const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true } // Price at the time of adding to cart
}, { _id: false });

const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    items: [itemSchema],
    total_amount: { type: Number, default: 0 }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

schema.pre('save', function (next) {
    this.total_amount = this.items.reduce((total, item) => total + (item.quantity * item.price), 0);
    next();
});

class Carts extends mongoose.Model {
}

schema.loadClass(Carts);
module.exports = mongoose.model("carts", schema);
