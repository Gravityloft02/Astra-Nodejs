"use strict";

/*
 * Purpose: To Manage Schema of Schools
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const schoolsSchema = new Schema({
    Name: { type: String, required: true},
    Address: { type: String, required: true },
    State: { type: String, required: true },
});

schoolsSchema.set('timestamps', true);

module.exports.SchoolsModel = mongoose.model('Schools', schoolsSchema);
