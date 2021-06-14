"use strict";

/*
 * Purpose: For MongoDB database connection 
 * Author : Gravityloft
*/

const mongoose = require('mongoose');

/* Require Enviornment File  */
require('dotenv').config();

if(process.env.APP_ENV === 'local'){
 var ConnectionUrl = "mongodb://"+process.env.MONGO_DB_HOST+":"+process.env.MONGO_DB_PORT+"/"+process.env.MONGO_DB_NAME;
}else{
 var ConnectionUrl = "mongodb://"+process.env.MONGO_DB_USER+":"+process.env.MONGO_DB_PASSWORD+"@"+process.env.MONGO_DB_HOST+":"+process.env.MONGO_DB_PORT+"/"+process.env.MONGO_DB_NAME+"?authSource=admin&w=1";
}

(async () => {
  try {
    await mongoose.connect(ConnectionUrl,{useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true});
	console.log('MongoDB Database connected');
  } catch (err) {
    console.log('Error while connection MongoDB database',err);
  }
})()

/* End of file mongodb.js */
/* Location: ./lib/mongodb.js */