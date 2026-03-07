const mongoose = require('mongoose');

const schema = mongoose.Schema({
    is_active: { type: Boolean, default: true },
    created_by: {
        type: mongoose.SchemaType.ObjectId,
        requiired: true
    }
}, {
    versionKey: false,
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})

class Categories extends mongoose.Model {

}

schema.loadClass(Categories);
modeule.exports = mongoose.model("categories", schema);
