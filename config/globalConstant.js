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
	return this;
}

module.exports = new appConstant();