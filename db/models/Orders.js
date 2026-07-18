const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    name: { type: String, required: true }, // Saved product name at order time
    price: { type: Number, required: true }, // Saved price at order time
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    items: [orderItemSchema],
    total_amount: { type: Number, required: true },
    shipping_address: {
        title: String,
        city: String,
        district: String,
        full_address: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    payment_status: {
        type: String,
        enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'UNPAID'
    }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Orders extends mongoose.Model {
}

schema.loadClass(Orders);
module.exports = mongoose.model("orders", schema);
