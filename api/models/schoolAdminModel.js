"use strict";

/*
 * Purpose: To Manage Schema of School Admin
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const schoolAdminSchema = new Schema({
    SchoolID: { type: Schema.ObjectId, required: true},
    AdminID: { type: Schema.ObjectId, required: true },
    ValidTill: { type: String, required: true },
});

schoolAdminSchema.set('timestamps', true);

module.exports.SchoolAdminModel = mongoose.model('School-Admin', schoolAdminSchema);
