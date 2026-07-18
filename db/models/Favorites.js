const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

// A user can only favorite a specific product once
schema.index({ user_id: 1, product_id: 1 }, { unique: true });

class Favorites extends mongoose.Model {
}

schema.loadClass(Favorites);
module.exports = mongoose.model("favorites", schema);
