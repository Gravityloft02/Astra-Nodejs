"use strict";

/*
 * Purpose: To Manage Schema of Admins
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const adminsSchema = new Schema({
    Name: { type: String, required: true},
    Phone: { 
    	type: String, 
    	required: true,
    	unique : [true,'Phone number already registered!']
    },
    Address: { type: String, required: true },
    DOB: { type: String, required: true },
});

adminsSchema.set('timestamps', true);

module.exports.AdminsModel = mongoose.model('Admins', adminsSchema);
