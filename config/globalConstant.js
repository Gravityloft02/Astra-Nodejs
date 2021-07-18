"use strict";

/*
 * Purpose: To define all constants
 * Author : Gravityloft
*/

/* Require Enviornment File  */
require('dotenv').config();

var appConstant = function () {

	this.ASIA_TIMEZONE = "+05:30";
	this.MIN_AGE = 18;
	this.GLOBAL_ERROR = "Some error occured, please try again.";
	this.RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1/";
	this.FIREBASE_SERVER_KEY="AAAA_c_XXCc:APA91bFTYGXt9sfRur8qfWTqjEVu87Yl0PDrw8ZFXA6942rGa25OuWVSykrucRlXsunp7wffkUzYQ9XIyyYG42rmwscyVzYMhN44acD2mVccrDyEVihgWXuWyRfvCraPvsnXcn3gaWaY";
	return this;
}

module.exports = new appConstant();