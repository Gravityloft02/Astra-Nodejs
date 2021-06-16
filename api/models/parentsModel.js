"use strict";

/*
 * Purpose: To Manage Schema of Parents
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const parentsSchema = new Schema({
    Name: { type: String, required: true},
    Phone: { 
    	type: String, 
    	required: true,
    	unique : [true,'Phone number already registered!']
    },
    Address: { type: String, required: true },
    DOB: { type: String, required: true },
});

parentsSchema.set('timestamps', true);

module.exports.ParentsModel = mongoose.model('Parents', parentsSchema);
