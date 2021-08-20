"use strict";

/*
 * Purpose: To Manage Schema of Schools
 * Author : Gravityloft
*/


const mongoose   = require('mongoose'),
      { Schema } = mongoose;

      /**Default payment option set to false */
const schoolsSchema = new Schema({
    Name: { type: String, required: true},
    Address: { type: String, required: true },
    State: { type: String, required: true },
    Payment_via_Astra:{type:Boolean,required:true,default:false}
});

schoolsSchema.set('timestamps', true);

module.exports.SchoolsModel = mongoose.model('Schools', schoolsSchema);
