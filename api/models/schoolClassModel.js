"use strict";

/*
 * Purpose: To Manage Schema of School Classes AY
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const schoolClassesSchema = new Schema({
    ClassID: { type: Number, required: true},
    SchoolID: { type: Schema.ObjectId, required: true },
    AcademicYear: { type: String, required: true},
    Std: { type: String, required: true },
    Division: { type: String, required: true },
});

module.exports.SchoolClassesModel = mongoose.model('School-class-AY', schoolClassesSchema);
