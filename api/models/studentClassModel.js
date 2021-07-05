"use strict";

/*
 * Purpose: To Manage Schema of Student Class
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const studentClassSchema = new Schema({
    StudentID: { type: String, required: true },
    SchoolClassID: { type: String, required: true },
});

module.exports.StudentClassModel = mongoose.model('Student-Class', studentClassSchema);
