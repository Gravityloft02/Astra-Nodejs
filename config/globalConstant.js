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
	return this;
}

module.exports = new appConstant();