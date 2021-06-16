"use strict";

/*
 * Purpose : API Middleware To Users
 * Package : Users
 * Developed By  : Gravityloft
 */

const async = require("async"),
	  jwt = require("jsonwebtoken");

/* Require Enviornment File  */
require('dotenv').config();

let userMiddleware = {verifyUserToken}

/**
  To Verify User Token
**/
async function verifyUserToken(req, res, next) {
	if(!req.headers.authorization){
		res.status(401).json({
            ResponseCode: 401, // Unauthorized
            Data : [],
            Message: 'Token missing !'
        });
        return;
	}

	/* Verify Token */
	jwt.verify((req.headers.authorization).replace('Bearer ','') ,process.env.TOKEN_SECRET,function(err,user){
		if(err){
			return res.status(403).json({ResponseCode: 403, Data : [], Message: 'Invalid Token !' }); // Forbidden
		}
		req.body.UserID = user.UserID;
		next();
	})
}

module.exports = userMiddleware;