"use strict";

/*
 * Purpose: For MongoDB database connection 
 * Author : Gravityloft
*/

const mongoose = require('mongoose');

/* Require Enviornment File  */
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect("mongodb://"+process.env.MONGO_DB_HOST+":"+process.env.MONGO_DB_PORT+"/"+process.env.MONGO_DB_NAME,{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
	console.log('MongoDB Database connected');
  } catch (err) {
    console.log('Error while connection MongoDB database',err);
  }
})()

/* End of file mongodb.js */
/* Location: ./lib/mongodb.js */