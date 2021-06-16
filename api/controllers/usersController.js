"use strict";

/*
 * Purpose : For Users Management
 * Package : Users
 * Developed By  : Gravityloft
*/

const async = require("async"),
      jwt = require('jsonwebtoken'),
      constant = require('../../config/globalConstant'),
      helper = require('../../lib/helper'),
      datetime = require('../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {UsersModel} = require("../models/usersModel");

/* Require Enviornment File  */
require('dotenv').config();

let usersController = {validate,authenticate}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'authenticate': {
              return [ 
                check('Phone').notEmpty().withMessage('Phone number field is required').trim().isLength({min: 10, max:10}).withMessage('Phone number field length should be 10').matches(/^[0-9]{10}$/).withMessage('Invalid Phone number'),
                check('Password').notEmpty().withMessage('Password field is required').trim()
               ]
           }
           break;
        }
  }

  /**
      For User Authenticate
  **/
  async function authenticate(req, res) {
    
     /* To Check Validation Results */
     let errors = validationResult(req);
     if (!errors.isEmpty()) {
         res.status(500).json({
                 ResponseCode: 500,
                 Data: [],
                 Message: errors.array()[0].msg
         });
         return;
      }

      /* To Verify Login Details */
      try {
        var UserObj = await UsersModel.findOne({ Phone: req.body.Phone}).select({"_id": 1, "Password" : 1}).limit(1).exec();
        if(!UserObj){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number not exists !'});
        }

        /* Validate Passowrd */
        if(!helper.compareHashStr(req.body.Phone,UserObj.Password)){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Incorrect Password !'});
        }

        /* Generate Token */
        let RespObj = {};
            RespObj.Token = jwt.sign({UserID:UserObj._id}, process.env.TOKEN_SECRET, { expiresIn: '3600s' }); // 60 minutes
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

module.exports = usersController;