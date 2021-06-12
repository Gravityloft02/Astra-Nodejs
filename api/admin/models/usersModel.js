"use strict";

/*
 * Purpose: To Manage Schema of Users
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const usersSchema = new Schema({
    Phone: { 
    	type: String, 
    	required: true,
    	unique : [true,'Phone number already registered!']
    },
    Password: { type: String, required: true },
});

usersSchema.set('timestamps', true);

module.exports.UsersModel = mongoose.model('Users', usersSchema);
