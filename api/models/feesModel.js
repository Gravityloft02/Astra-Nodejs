"use strict";

/*
 * Purpose: To Manage Schema of Fees
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const feesSchema = new Schema({
    SchoolID: { type: Schema.ObjectId, required: true},
    ClassID: { type: Schema.ObjectId, required: true},
    Amount: { type: Number, required: true},
    DueDate: { type: String, required: true },
});

feesSchema.set('timestamps', true);

module.exports.FeesModel = mongoose.model('Fees', feesSchema);
