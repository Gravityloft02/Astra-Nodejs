"use strict";

/*
 * Purpose: To Manage Schema of Students
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const studentsSchema = new Schema({
    Name: { type: String, required: true, unique : true},
    Address: { type: String, required: true },
    DOB: { type: String, required: true },
});

studentsSchema.set('timestamps', true);

module.exports.StudentsModel = mongoose.model('Students', studentsSchema);
