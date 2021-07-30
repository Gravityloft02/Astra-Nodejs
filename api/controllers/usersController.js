"use strict";

/*
 * Purpose : For Users Management
 * Package : Users (Admin + Parent)
 * Developed By  : Gravityloft
*/

const async = require("async"),   
      mongoose = require("mongoose"),
      constant = require('../../config/globalConstant'),
      helper = require('../../lib/helper'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {UsersModel} = require("../models/usersModel");

/* Require Enviornment File  */
require('dotenv').config();

let usersController = {validate,change_password}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
         case 'change_password': {
            return [ 
              check('OldPassword').notEmpty().withMessage('Old Password field is required').trim(),
              check('NewPassword').notEmpty().withMessage('New Password field is required').trim()
             ]
         }
         break;
        }
  }

  /**
      For Change User Password
  **/
  async function change_password(req, res) {
    
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

      /* To Verify Old Password */
      try {
        var UserObj = await UsersModel.findOne({ _id: mongoose.Types.ObjectId(req.body.UserID)}).select({"_id": 0, "Password" : 1}).limit(1).exec();

        /* Validate Passowrd */
        if(!helper.compareHashStr(req.body.OldPassword,UserObj.Password)){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Incorrect Old Password !'});
        }

        /* To Update User New Password */
        let HashPassword = await helper.generateHashStr(req.body.NewPassword)
        let UserUpdate = await UsersModel.updateOne({ _id: mongoose.Types.ObjectId(req.body.UserID)},{Password:HashPassword},{upsert:false, rawResult:true});
        if(UserUpdate.ok){
          return res.status(200).json({ResponseCode: 200, Data: [], Message: 'Password changed successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

module.exports = usersController;