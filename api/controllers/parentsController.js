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
      request = require('request'),
      mongoose = require('mongoose'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {UsersModel} = require("../models/usersModel");
const {ParentsModel} = require("../models/parentsModel");
const {StudentsModel} = require("../models/studentsModel");
const {PaymentsModel} = require("../models/paymentsModel");
const {ParentStudentModel} = require("../models/parentStudentModel");
const {StudentClassModel} = require("../models/studentClassModel");
     
/* Require Enviornment File  */
require('dotenv').config();

let parentsController = {validate,authenticate,update_device_details,fee_initiate,fee_payment_verify,payment_history}

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
                check('Amount').notEmpty().withMessage('Amount field is required').trim().custom(amount => {   
                  if(parseInt(amount) <= 0){
                    return Promise.reject('Fee amount should be greater than to Zero.');
                  }
                  return Promise.resolve(true);
                })
               ]
           }
           break;
           case 'fee_payment_verify': {
              return [ 
                check('PaymentID').notEmpty().withMessage('Payment ID field is required').trim(),
                check('RazorPayPaymentID').notEmpty().withMessage('RazorPay Payment ID field is required').trim()
              ]
           }
           break;
           case 'payment_history': {
              return [ 
                check('Limit').notEmpty().withMessage('Limit field is required').trim(),
                check('Offset').notEmpty().withMessage('Offset field is required').trim()
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

        /* To Get Response Details */
        var ParentRespObj = await ParentStudentModel.aggregate([
                              { "$lookup": {
                                  "from": "student-classes",
                                  "localField": "StudentID",
                                  "foreignField": "StudentID",
                                  "as": "studentclasses"
                              } },    
                              { "$unwind": "$studentclasses" },
                              { "$lookup": {
                                  "from": "school-class-ays",
                                  "localField": "studentclassesays._id",
                                  "foreignField": "studentclasses.SchoolClassID",
                                  "as": "studentclassesays"
                              } },
                              { "$lookup": {
                                  "from": "fees",
                                  "localField": "fees.SchoolID",
                                  "foreignField": "studentclassesays.SchoolID",
                                  "as": "fees"
                              } },
                              // { "$match": { "ParentID": (ParentObj._id).toString(), "fees.ClassID" : 7} },
                              { "$match": { "ParentID": (ParentObj._id).toString()}},
                              { "$project": {
                                  "_id" : 0,
                                  "StudentID": 1,
                                  "SchoolID" : { "$arrayElemAt" : ["$studentclassesays.SchoolID", 0] },
                                  "Amount" : { "$arrayElemAt" : ["$fees.Amount", 0] },
                                  "DueDate" : { "$arrayElemAt" : ["$fees.DueDate", 0] }
                              } },
                              {
                                "$limit" : 1
                              }
                           ]).exec();

        /* To Check Empty Array */
        if(ParentRespObj.length === 0){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: "Data not found !!"});
        }

        /* Fetch Paid Amount Details */
        var AmountObj = await PaymentsModel.aggregate([
                                { "$match": { "StudentID": (ParentRespObj[0].StudentID).toString(), "Status" : "Success"}},
                                {
                                    $group : {
                                        _id : null,
                                        total : {
                                            $sum : "$Amount"
                                        }
                                    }
                                }
                              ]).exec();

        /* Generate Token */
        let RespObj = {};
            RespObj.Token = jwt.sign({UserID:UserObj._id, ParentID:ParentObj._id, UserType : 'Parent'}, process.env.TOKEN_SECRET, { expiresIn: '36000s' }); // 600 minutes
            RespObj.StudentID = ParentRespObj[0].StudentID;
            RespObj.SchoolID = ParentRespObj[0].SchoolID;
            RespObj.FeeAmount = ParentRespObj[0].Amount;
            RespObj.DueDate = ParentRespObj[0].DueDate;
            RespObj.AmountPaid = (AmountObj.length === 0) ? 0 : AmountObj[0].total;
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
      } catch (err) {
        console.log(err)
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

      /* To Get Student Fees Details */
      var StudentFeeObj = await StudentClassModel.aggregate([
                                    { "$lookup": {
                                        "from": "school-class-ays",
                                        "localField": "_id",
                                        "foreignField": "SchoolClassID",
                                        "as": "studentclassesays"
                                    } }, 
                                    { "$lookup": {
                                        "from": "fees",
                                        "localField": "fees.SchoolID",
                                        "foreignField": "studentclassesays.SchoolID",
                                        "as": "fees"
                                    } },
                                     // { "$match": { "StudentID": (req.body.StudentID).toString(), "fees.ClassID" : 7} },
                                    { "$match": { "StudentID": (req.body.StudentID).toString()} },
                                    { "$project": {
                                      "_id" : 0,
                                      "Amount" : { "$arrayElemAt" : ["$fees.Amount", 0] },
                                      "FeeID" : { "$arrayElemAt" : ["$fees._id", 0] }
                                    } },
                                    {
                                      "$limit" : 1
                                    }
                                ]).exec();

      /* Save Payment */
      let PaymentData = {};
          PaymentData.StudentID = req.body.StudentID;
          PaymentData.ParentID  = req.body.ParentID;
          PaymentData.Amount    = req.body.Amount;
          PaymentData.Status    = "Pending";
          PaymentData.FeeID = StudentFeeObj[0].FeeID;
      let PaymentsModelObj = new PaymentsModel(PaymentData);
      let Payment = await PaymentsModelObj.save();
      if(Payment._id){
        return res.status(200).json({ResponseCode: 200, Data: {PaymentID:Payment._id, RazorPayKeyID : process.env.RAZORPAY_KEY_ID}, Message: 'success.'});
      }else{
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /**
      For Verify Student Fee Payment
  **/
  async function fee_payment_verify(req, res) {
    
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

      /* Check Payment Status */
      var PaymentObj = await PaymentsModel.findOne({ _id: req.body.PaymentID}).select({"_id": 1, "Status" : 1, "TransactionID" : 1, "Amount" : 1, "StudentID" : 1}).limit(1).exec();
      if(!PaymentObj){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Invalid Payment ID !'});
      }

      /* Fetch Paid Amount Details */
      var AmountObj = await PaymentsModel.aggregate([
                        { "$match": { "StudentID": (PaymentObj.StudentID).toString(), "Status" : "Success"}},
                        {
                            $group : {
                                _id : null,
                                total : {
                                    $sum : "$Amount"
                                }
                            }
                        }
                      ]).exec();
      var AmountPaid = (AmountObj.length === 0) ? 0 : AmountObj[0].total;

      if(PaymentObj.Status === "Failed"){
        return res.status(500).json({ResponseCode: 500, Data: {PayemntStatus:PaymentObj.Status,TransactionID:PaymentObj.TransactionID,AmountPaid:PaymentObj.Amount,TotalFeePaid:AmountPaid}, Message: 'Payemnt failed.'});
      }else if(PaymentObj.Status === "Success"){
        return res.status(200).json({ResponseCode: 200, Data: {PayemntStatus:PaymentObj.Status,TransactionID:PaymentObj.TransactionID,AmountPaid:PaymentObj.Amount,TotalFeePaid:AmountPaid}, Message: 'Payemnt successfully completed.'});
      }

      /* Fetch RazorPay Payment Details */
      var options = {
        'method': 'GET',
        'url': constant.RAZORPAY_API_BASE_URL + 'payments/' + req.body.RazorPayPaymentID,
        'headers': {
          'Authorization': "Basic " + new Buffer(process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_SECRET_KEY).toString("base64"),
        }
      };
      request(options, async function (error, response) {
        if (error) throw new Error(error);
        let RespObj = JSON.parse(response.body);
        if(RespObj.error){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: RespObj.error.description});
        }

        /* Update Payment  Details */
        var AmountPaidRP = (RespObj.amount/100);
        let PayemntStatus = (RespObj.status === 'captured') ? "Success" : "Failed";
        if(PayemntStatus === 'Success'){
          AmountPaid = AmountPaid + AmountPaidRP;
        }
        try {
          var ParentObj = await PaymentsModel.findOneAndUpdate({ _id: req.body.PaymentID},{ TransactionID: RespObj.id, RazorPayJsonResponse : RespObj, Status : PayemntStatus},{upsert:false, rawResult:true});
          return res.status(200).json({ResponseCode: 200, Data: {PayemntStatus:PayemntStatus,TransactionID:RespObj.id, AmountPaid : AmountPaidRP, TotalFeePaid : AmountPaid}, Message: 'success'});
        } catch (err) {
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      });
  }

  /**
      For Payment History
  **/
  async function payment_history(req, res) {
    
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

      let ParentID  = req.body.ParentID;

      /* To Get Parent & Student Details */
      var ParentRespObj = await ParentsModel.aggregate([
                            { "$lookup": {
                                "from": "parent-students",
                                "localField": "ParentID", // Child Colletion Field
                                "foreignField": "_id", // Parent Colletion Field
                                "as": "parentstudents"
                            } },   
                            { "$lookup": {
                                "from": "students",
                                "localField": "students._id",
                                "foreignField": "parentstudents.StudentID",
                                "as": "students"
                            } },
                            { "$match": { "_id": mongoose.Types.ObjectId(ParentID)}},
                            { "$project": {
                                "_id" : 0,
                                "Name": 1,
                                "StudentID" : { "$arrayElemAt" : ["$students._id", 0] },
                                "StudentName" : { "$arrayElemAt" : ["$students.Name", 0] },
                            } },
                            {
                              "$limit" : 1
                            }
                         ]).exec();
      
      /* To Check Empty Array */
      if(ParentRespObj.length === 0){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Data not found !!"});
      }

      /* To Get Payment History */
      var PaymentHistory = await PaymentsModel.aggregate([
                                  { "$lookup": {
                                      "from": "student-classes",
                                      "localField": "StudentID",
                                      "foreignField": "StudentID",
                                      "as": "studentclasses"
                                  } },  
                                  { "$lookup": {
                                      "from": "school-class-ays",
                                      "localField": "studentclassesays._id",
                                      "foreignField": "studentclasses.SchoolClassID",
                                      "as": "studentclassesays"
                                  } },  
                                  { "$lookup": {
                                      "from": "schools",
                                      "localField": "schools._id",
                                      "foreignField": "studentclassesays.SchoolID",
                                      "as": "schools"
                                  } },  
                                  { "$lookup": {
                                      "from": "fees",
                                      "localField": "fees._id",
                                      "foreignField": "FeeID",
                                      "as": "fees"
                                  } },  
                                  { "$match": { "ParentID": (ParentID).toString(), "Status" : {"$in" : ["Failed","Success"]} } },
                                  { "$project": {
                                      "PaymentID" : "$_id",
                                      "Amount" : "$Amount",
                                      "PaymentDate" : "$createdAt",
                                      "_id" : 0,
                                      "Status": 1,
                                      "FeeID": 1,
                                      "TransactionID": 1,
                                      "DueDate" : { "$arrayElemAt" : ["$fees.DueDate", 0] },
                                      "ClassID" : { "$arrayElemAt" : ["$studentclassesays.ClassID", 0] },
                                      "SchoolID" : { "$arrayElemAt" : ["$studentclassesays.SchoolID", 0] },
                                      "SchoolName" : { "$arrayElemAt" : ["$schools.Name", 0] },
                                      "AcademicYear" : { "$arrayElemAt" : ["$studentclassesays.AcademicYear", 0] },
                                      "Std" : { "$arrayElemAt" : ["$studentclassesays.Std", 0] },
                                      "Division" : { "$arrayElemAt" : ["$studentclassesays.Division", 0] },
                                  } },
                                  {
                                    "$sort" : {"PaymentDate" : -1}
                                  },
                                  {
                                    "$limit" : parseInt(req.query.Limit) + parseInt(req.query.Offset),
                                  },
                                  {
                                    "$skip" : parseInt(req.query.Offset),
                                  }
                              ]).exec()

      /* To Check Empty Array */
      if(PaymentHistory.length === 0){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Data not found !!"});
      }

      /* Response Object */
      let RespObj = {};
          RespObj.ParentID = ParentID;
          RespObj.ParentName = ParentRespObj[0].Name;
          RespObj.PaymentData = {
              'StudentID' : (ParentRespObj[0].StudentID).toString(),
              'StudentName' : ParentRespObj[0].StudentName
          }
          RespObj.PaymentData.StudentPayment = PaymentHistory;
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
  }


module.exports = parentsController;