"use strict";

/*
 * Purpose : For Parents Management
 * Package : Parents
 * Developed By  : Gravityloft
*/

const async = require("async"),
      jwt = require('jsonwebtoken'),
      constant = require('../../config/globalConstant'),
      helper = require('../../lib/helper'),
      datetime = require('../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {UsersModel} = require("../models/usersModel");
const {ParentsModel} = require("../models/parentsModel");
const {StudentsModel} = require("../../models/studentsModel");
const {PaymentsModel} = require("../../models/paymentsModel");

/* Require Enviornment File  */
require('dotenv').config();

let parentsController = {validate,authenticate,update_device_details,fee_initiate}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'authenticate': {
              return [ 
                check('Phone').notEmpty().withMessage('Phone number field is required').trim().isLength({min: 10, max:10}).withMessage('Phone number field length should be 10').matches(/^[0-9]{10}$/).withMessage('Invalid Phone number'),
                check('Password').notEmpty().withMessage('Password field is required').trim(),
                check('DeviceType').notEmpty().withMessage('Device Type field is required').trim().isIn(['Android', 'IOS']).withMessage('Device type value should be Android Or IOS'),
                check('DeviceKey').notEmpty().withMessage('Device Key field is required').trim()
               ]
           }
           break;
           case 'update_device_details': {
              return [ 
                check('DeviceType').notEmpty().withMessage('Device Type field is required').trim().isIn(['Android', 'IOS']).withMessage('Device type value should be Android Or IOS'),
                check('DeviceKey').notEmpty().withMessage('Device Key field is required').trim()
               ]
           }
           break;
           case 'fee_initiate': {
              return [ 
                check('StudentID').notEmpty().withMessage('Student ID field is required').trim().custom(val => {   
                  return StudentsModel.findOne({ _id: val}).select({"_id": 1}).exec().then(student => {
                    if (!student) {
                      return Promise.reject('Invalid Student ID.');
                    }
                    return Promise.resolve(true);
                  });
                }),
                check('Amount').notEmpty().withMessage('Amount field is required').trim()
               ]
           }
           break;
        }
  }

  /**
      For Parent Authenticate
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

        /* Check Entry In Parents */
        var ParentObj = await ParentsModel.findOne({ Phone: req.body.Phone}).select({"_id": 1}).limit(1).exec();
        if(!ParentObj){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number not exists !'});
        }

        /* To Update Device Details (Background Process) */
        await ParentsModel.updateOne({ _id: ParentObj._id},{ DeviceType: req.body.DeviceType, DeviceKey: req.body.DeviceKey},{upsert:false, rawResult:true});

        /* Generate Token */
        let RespObj = {};
            RespObj.Token = jwt.sign({UserID:UserObj._id, ParentID:ParentObj._id, UserType : 'Parent'}, process.env.TOKEN_SECRET, { expiresIn: '3600s' }); // 60 minutes
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /**
      For Update Device Details
  **/
  async function update_device_details(req, res) {
    
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

      /* To Update Device Details */
      try {
        var ParentObj = await ParentsModel.findOneAndUpdate({ _id: req.body.ParentID},{ DeviceType: req.body.DeviceType, DeviceKey: req.body.DeviceKey},{upsert:false, rawResult:true});
        return res.status(200).json({ResponseCode: 200, Data: [], Message: 'success'});
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /**
      For Initiate Student Fee
  **/
  async function fee_initiate(req, res) {
    
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

      /* Save Payment */
      let PaymentData = {};
          PaymentData.StudentID = req.body.StudentID;
          PaymentData.ParentID  = req.body.ParentID;
          PaymentData.Amount    = req.body.Amount;
          PaymentData.Status    = "Pending";
          PaymentData.FeeID = "Pending";
      let PaymentsModelObj = new PaymentsModel(PaymentData);
      let Payment = await PaymentsModelObj.save();
      if(Payment._id){
        return res.status(200).json({ResponseCode: 200, Data: {PaymentID:Payment._id, RazorPayMerchantKey : process.env.RAZORPAY_MERCHANT_KEY}, Message: 'success.'});
      }else{
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

module.exports = parentsController;