"use strict";

/*
 * Purpose: To Manage Schema of School Admin
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const schoolAdminSchema = new Schema({
    SchoolID: { type: String, required: true},
    AdminID: { type: String, required: true },
    ValidTill: { type: String, required: true },
});

schoolAdminSchema.set('timestamps', true);

module.exports.SchoolAdminModel = mongoose.model('School-Admin', schoolAdminSchema);
