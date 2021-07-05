"use strict";

/*
 * Purpose: To Manage Schema of Student Class
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const studentClassSchema = new Schema({
    StudentID: { type: String, required: true },
    ClassID: { type: Number, required: true},
});

module.exports.StudentClassModel = mongoose.model('Student-Class', studentClassSchema);
