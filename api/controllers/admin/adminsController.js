"use strict";

/*
 * Purpose : For Admins Management
 * Package : Admins
 * Developed By  : Gravityloft
*/

const async = require("async"),
      jwt   = require("jsonwebtoken"),
      constant = require('../../../config/globalConstant'),
      helper = require('../../../lib/helper'),
      datetime = require('../../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {AdminsModel} = require("../../models/adminsModel");
const {UsersModel} = require("../../models/usersModel");

/* Require Enviornment File  */
require('dotenv').config();

let adminsController = {validate,add,authenticate}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'add': {
              return [ 
                check('Name').notEmpty().withMessage('Name field is required').trim().escape(),
                check('Address').notEmpty().withMessage('Address field is required').trim().escape(),
                check('Phone').notEmpty().withMessage('Phone number field is required').trim().isLength({min: 10, max:10}).withMessage('Phone number field length should be 10').matches(/^[0-9]{10}$/).withMessage('Invalid Phone number'),
                check('DOB').notEmpty().withMessage('Date of birth field is required').trim().custom(dob => {  
                   if (!datetime.validateDateTime(dob,'YYYY-MM-DD')){
                     throw new Error('Invalid Date of birth Or format, It should be (YYYY-MM-DD)');
                   }else if(datetime.getUserAge(dob) < constant.MIN_AGE){
                     throw new Error('Age should be greater than or equal to '+constant.MIN_AGE);
                   }
                   return true
                }),
                check('RazorPayRouteAccountID').notEmpty().withMessage('RazorPay Route Account ID field is required').trim().escape(),
                check('Password').trim()
               ]
           }
           break;
           case 'authenticate': {
              return [ 
                check('Phone').notEmpty().withMessage('Phone number field is required').trim().isLength({min: 10, max:10}).withMessage('Phone number field length should be 10').matches(/^[0-9]{10}$/).withMessage('Invalid Phone number'),
                check('Password').notEmpty().withMessage('Password field is required').trim(),
               ]
           }
           break;
        }
  }

  /**
      For Add Admin
  **/
  async function add(req, res) {
    
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

      /* To Validate Unique Phone Number */
      try {
        var IsPhoneNumber = await AdminsModel.findOne({ Phone: req.body.Phone}).select({ "Phone": 1, "_id": 0}).limit(1).exec();
        if(IsPhoneNumber){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number already registered !'});
        }
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }

      /* Save Admin */
      let AdminModelObj = new AdminsModel({Name:req.body.Name,Address:req.body.Address,Phone:req.body.Phone,DOB:req.body.DOB,RazorPayRouteAccountID:req.body.RazorPayRouteAccountID});
      try {
        let Admin = await AdminModelObj.save();
        if(Admin._id){

          /* To Validate Already a User with Different Role */
          try {
            var IsPhoneNumber = await UsersModel.findOne({ Phone: req.body.Phone}).select({ "Phone": 1, "_id": 0}).limit(1).exec();
            if(!IsPhoneNumber){
              
              /* Save User Entry */
              let HashPassword = await helper.generateHashStr(req.body.Password||req.body.Phone);
              let UserModelObj = new UsersModel({Phone:req.body.Phone, Password:HashPassword});
              UserModelObj.save();
            }
          } catch (err) {
            return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
          }
          return res.status(200).json({ResponseCode: 200, Data: {AdminID:Admin._id}, Message: 'Admin created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      } catch (err) {

        console.log(err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /**
      For Admin Authenticate
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
        if(!helper.compareHashStr(req.body.Password,UserObj.Password)){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Incorrect Password !'});
        }

        /* Check Entry In Admins */
        var AdminObj = await AdminsModel.findOne({ Phone: req.body.Phone}).select({"_id": 1}).limit(1).exec();
        if(!AdminObj){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number not exists !'});
        }

        /* Generate Token */
        let RespObj = {};
            RespObj.Token = jwt.sign({UserID:UserObj._id, AdminID:AdminObj._id, UserType : 'Admin'}, process.env.TOKEN_SECRET, { expiresIn: '3600s' }); // 60 minutes
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }


module.exports = adminsController;