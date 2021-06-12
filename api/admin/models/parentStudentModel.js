"use strict";

/*
 * Purpose: To Manage Schema of Parent Student
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const parentStudentSchema = new Schema({
    ParentID: { type: String, required: true},
    StudentID: { type: String, required: true },
    ValidTill: { type: String, required: true },
});

parentStudentSchema.set('timestamps', true);

module.exports.ParentStudentModel = mongoose.model('Parent-Student', parentStudentSchema);
