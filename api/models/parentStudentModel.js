"use strict";

/*
 * Purpose: To Manage Schema of Parent Student
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const parentStudentSchema = new Schema({
    ParentID: { type: Schema.ObjectId, required: true},
    StudentID: { type: Schema.ObjectId, required: true },
    ValidTill: { type: String, required: true },
    StudentClass: [{ type: Schema.Types.ObjectId, ref:'StudentClassModel' }],
});

parentStudentSchema.set('timestamps', true);

module.exports.ParentStudentModel = mongoose.model('Parent-Student', parentStudentSchema);
