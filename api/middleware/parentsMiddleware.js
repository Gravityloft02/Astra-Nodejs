"use strict";

/*
 * Purpose : API Middleware To Parents
 * Package : Parents
 * Developed By  : Gravityloft
 */

const async = require("async"),
	  jwt = require("jsonwebtoken");

/* Require Enviornment File  */
require('dotenv').config();

let parentsMiddleware = {verifyToken}

/**
  To Verify Parent Token
**/
async function verifyToken(req, res, next) {
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
		}else if(!user.UserType || user.UserType != 'Parent'){
			return res.status(403).json({ResponseCode: 403, Data : [], Message: 'Access denied !' }); // Forbidden
		}
		req.body.UserID = user.UserID;
		req.body.ParentID = user.ParentID;
		req.body.UserType = user.UserType;
		next();
	})
}

module.exports = parentsMiddleware;