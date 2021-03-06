"use strict";

/*
 * Purpose : For Parents Management
 * Package : Parents
 * Developed By  : Gravityloft
*/

const async = require("async"),
      jwt = require('jsonwebtoken'),
      _ = require('underscore'),
      constant = require('../../config/globalConstant'),
      helper = require('../../lib/helper'),
      datetime = require('../../lib/datetime'),
      axios = require('axios'),
      mongoose = require('mongoose'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {UsersModel} = require("../models/usersModel");
const {ParentsModel} = require("../models/parentsModel");
const {StudentsModel} = require("../models/studentsModel");
const {PaymentsModel} = require("../models/paymentsModel");
const {ParentStudentModel} = require("../models/parentStudentModel");
const {StudentClassModel} = require("../models/studentClassModel");
const {NotificationsModel} = require("../models/notificationsModel");
const {SchoolClassesModel} = require("../models/schoolClassModel");
const {FeesModel} = require("../models/feesModel");
const {AdminsModel} = require("../models/adminsModel");

/* Require Enviornment File  */
require('dotenv').config();

let parentsController = {validate,authenticate,update_device_details,fee_initiate,fee_payment_verify,payment_history,getNotifications}

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
        var ParentObj = await ParentsModel.findOne({ Phone: req.body.Phone}).select({"_id": 1, "Name" : 1}).limit(1).exec();
        if(!ParentObj){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number not exists !'});
        }

        /* To Update Device Details (Background Process) */
        await ParentsModel.updateOne({ _id: mongoose.Types.ObjectId(ParentObj._id)},{ DeviceType: req.body.DeviceType, DeviceKey: req.body.DeviceKey},{upsert:false, rawResult:true});

        let parentStudent = await ParentStudentModel.findOne({ParentID : mongoose.Types.ObjectId(ParentObj._id)});

        let studentClass = await StudentClassModel.findOne({StudentID : mongoose.Types.ObjectId(parentStudent.StudentID)});

        let fees = await FeesModel.findOne({ClassID: mongoose.Types.ObjectId(studentClass.SchoolClassID)});

        /* Fetch Paid Amount Details */
        var AmountObj = await PaymentsModel.aggregate([
                                { "$match": { "StudentID": mongoose.Types.ObjectId(parentStudent.StudentID), "Status" : "Success"}},
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
            RespObj.StudentID = parentStudent.StudentID;
            RespObj.SchoolID = fees.SchoolID;
            RespObj.FeeAmount = fees.Amount;
            RespObj.DueDate = fees.DueDate;
            RespObj.ParentName = ParentObj.Name;
            RespObj.HelpContactNo = '+91-8080808080';
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
        var ParentObj = await ParentsModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.ParentID)},{ DeviceType: req.body.DeviceType, DeviceKey: req.body.DeviceKey},{upsert:false, rawResult:true});
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
      var StudentClassObj = await StudentClassModel.findOne({ StudentID: mongoose.Types.ObjectId(req.body.StudentID)}).select({"_id": 0, "SchoolClassID" : 1}).exec();

      /* To Get Fees */
      var FeeObj = await FeesModel.findOne({ ClassID: mongoose.Types.ObjectId(StudentClassObj.SchoolClassID)}).select({"SchoolID": 1}).exec();

      /* To Get Admin Details */
      var AdminObj = await AdminsModel.aggregate([
                                  { "$lookup": {
                                      "from": "school-admins",
                                      "localField": "_id",
                                      "foreignField": "AdminID",
                                      "as": "schooladmins"
                                  } },
                                  { "$match": { "schooladmins.SchoolID": mongoose.Types.ObjectId(FeeObj.SchoolID)}},
                                  { "$project": {
                                      "_id" : 0,
                                      "RazorPayRouteAccountID" : 1
                                  } }
                               ]).exec();

      /* Create Order On Razorpay */
      var config = {
          method: 'POST',
          url: constant.RAZORPAY_API_BASE_URL + 'orders',
          headers: {'Content-Type': 'application/json', 'Authorization': "Basic " + new Buffer(process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_SECRET_KEY).toString("base64")},
          data : {"amount" : req.body.Amount * 100, currency : "INR", "receipt" : "receipt#1"}
        };
        try {
          var RazorPayOrderObj = await axios(config);
        } catch (error) {
          console.log('Create Order RazorPay Payemnt error',error);
          return res.status(500).json({ResponseCode: 500, Data: [], Message: error.message});
        }

      /* Save Payment */
      let PaymentData = {};
          PaymentData.StudentID = req.body.StudentID;
          PaymentData.ParentID  = req.body.ParentID;
          PaymentData.Amount    = req.body.Amount;
          PaymentData.Status    = "Pending";
          PaymentData.FeeID = FeeObj._id;
          PaymentData.PaidToAccountID = AdminObj[0].RazorPayRouteAccountID;
          PaymentData.RazorPayOrderID = RazorPayOrderObj.data.id;
      let PaymentsModelObj = new PaymentsModel(PaymentData);
      let Payment = await PaymentsModelObj.save();
      if(Payment._id){
        return res.status(200).json({ResponseCode: 200, Data: {PaymentID:Payment._id, RazorPayOrderID : PaymentData.RazorPayOrderID, RazorPayKeyID : process.env.RAZORPAY_KEY_ID, AppLogo : process.env.APP_DIR_BASE_URL + 'assets/logo.png'}, Message: 'success.'});
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
      var PaymentObj = await PaymentsModel.findOne({ _id: mongoose.Types.ObjectId(req.body.PaymentID)}).select({"_id": 1, "Status" : 1, "TransactionID" : 1, "Amount" : 1, "StudentID" : 1, "PaidToAccountID" : 1, "RazorPayOrderID" : 1}).limit(1).exec();
      if(!PaymentObj){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Invalid Payment ID !'});
      }

      /* Fetch Paid Amount Details */
      var AmountObj = await PaymentsModel.aggregate([
                        { "$match": { "StudentID": mongoose.Types.ObjectId(PaymentObj.StudentID), "Status" : "Success"}},
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
      var RazorPayHeaders = {'Content-Type': 'application/json', 'Authorization': "Basic " + new Buffer(process.env.RAZORPAY_KEY_ID + ":" + process.env.RAZORPAY_SECRET_KEY).toString("base64")};
      var config = {
        method: 'GET',
        url: constant.RAZORPAY_API_BASE_URL + 'payments/' + req.body.RazorPayPaymentID,
        headers: RazorPayHeaders,
        data : {}
      };
      try {
        var RazorPayRespObj = await axios(config);
            RazorPayRespObj = RazorPayRespObj.data;
      } catch (error) {
        console.log('Fetch RazorPay payment details error',error);
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error.message});
      }

      /* Capture Payment */
      if(RazorPayRespObj.status === 'authorized'){
        var config = {
          method: 'POST',
          url: constant.RAZORPAY_API_BASE_URL + 'payments/' + req.body.RazorPayPaymentID + '/capture',
          headers: RazorPayHeaders,
          data : {"amount" : RazorPayRespObj.amount, "currency" : "INR"}
        };
        try {
          var RazorPayRespObj = await axios(config);
              RazorPayRespObj = RazorPayRespObj.data;
        } catch (error) {
          console.log('Captured RazorPay payment details error',error);
          return res.status(500).json({ResponseCode: 500, Data: [], Message: error.message});
        }
      }

      /* Update Payment  Details */
      var UpdatePayemntObj = { TransactionID: RazorPayRespObj.id, RazorPayJsonResponse : RazorPayRespObj};
      var AmountPaidRP = (RazorPayRespObj.amount/100);
      let PayemntStatus = (RazorPayRespObj.status === 'captured') ? "Success" : "Failed";
          UpdatePayemntObj.Status = PayemntStatus;
      if(PayemntStatus === 'Success'){
        AmountPaid = AmountPaid + AmountPaidRP;

        /* Transfer Amount To Route Account */
        var config = {
          method: 'POST',
          url: constant.RAZORPAY_API_BASE_URL + 'payments/' + req.body.RazorPayPaymentID + '/transfers',
          headers: RazorPayHeaders,
          data : {"transfers" : [{"account" : PaymentObj.PaidToAccountID, "amount" : RazorPayRespObj.amount, "currency" : "INR", "notes" : {"Comment" : "Astra student fees"}}]}
        };
        try {
          var RazorPayRespObj = await axios(config);
              UpdatePayemntObj.TransferPaymentRazorPayRouteJsonResponse = RazorPayRespObj.data;
        } catch (error) {
          console.log('FTransfer RazorPay Payemnt error',error);
          return res.status(500).json({ResponseCode: 500, Data: [], Message: error.message});
        }
      }

      try {
        var ParentObj = await PaymentsModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.body.PaymentID)}, UpdatePayemntObj,{upsert:false, rawResult:true});
        return res.status(200).json({ResponseCode: 200, Data: {PayemntStatus:PayemntStatus,TransactionID:UpdatePayemntObj.TransactionID, AmountPaid : AmountPaidRP, TotalFeePaid : AmountPaid}, Message: 'success'});
      } catch (err) {
        console.log('err',err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
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
      let ParentRespObj = await ParentsModel.findOne({_id : mongoose.Types.ObjectId(ParentID)});

      let ParentStudentRespObj = await ParentStudentModel.findOne({ParentID : mongoose.Types.ObjectId(ParentRespObj._id)});

      let StudentRespObj = await StudentsModel.findOne({_id : mongoose.Types.ObjectId(ParentStudentRespObj.StudentID)});

      let studentClass = await StudentClassModel.findOne({StudentID : mongoose.Types.ObjectId(ParentStudentRespObj.StudentID)});

      let fees = await FeesModel.findOne({ClassID: mongoose.Types.ObjectId(studentClass.SchoolClassID)});

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
                                  { "$match": { "ParentID": mongoose.Types.ObjectId(ParentID), "Status" : {"$in" : ["Failed","Success"]} } },
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
                                      "Division" : { "$arrayElemAt" : ["$studentclassesays.Division", 0] }
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

      /* Fetch Paid Amount Details */
      var AmountObj = await PaymentsModel.aggregate([
                            { "$match": { "StudentID": mongoose.Types.ObjectId(ParentStudentRespObj.StudentID), "Status" : "Success"}},
                            {
                                $group : {
                                    _id : null,
                                    total : {
                                        $sum : "$Amount"
                                    }
                                }
                            }
                          ]).exec();

      /* Response Object */
      let RespObj = {};
          RespObj.ParentID = ParentID;
          RespObj.ParentName = ParentRespObj.Name;
          RespObj.FeeAmount = fees.Amount;
          RespObj.AmountPaid = (AmountObj.length === 0) ? 0 : AmountObj[0].total;
          RespObj.PaymentData = {
              'StudentID' : (ParentStudentRespObj.StudentID).toString(),
              'StudentName' : StudentRespObj.StudentName
          }
          RespObj.PaymentData.StudentPayment = PaymentHistory;
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
  }

    /**
      For Get Notifications
  **/
 async function getNotifications(req, res) {
    
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

  try{
    let ParentDetails = await ParentsModel.findOne({_id : mongoose.Types.ObjectId(req.body.ParentID)});

    if(ParentDetails){
      let ParentsStudents = await ParentStudentModel.find({ParentID : mongoose.Types.ObjectId(ParentDetails._id)});

      let student_ids = _.pluck(ParentsStudents, "StudentID");
      let notifications = await NotificationsModel.find({StudentID : {$in : student_ids}}).select({NotificationSubject : 1, NotificationContent : 1, createdAt : 1, StudentID: 1}).sort({"createdAt": -1}).limit(200);

      if(notifications && notifications.length){
        let notificationsfinal = [];
        
        async.each(notifications, async function(notification, callback){
          
          let notification_date = new Date(notification.createdAt);  // yyyy-mm-dd
          var month = notification_date.toLocaleString('default', { month: 'long' });
          let finalstudentids = _.intersection(student_ids, notification.StudentID);
          let students = await StudentsModel.find({_id : {$in : finalstudentids}}).select({'Name' : 1});
          let obj = Object.assign(notification._doc, {});
        
          obj.students = students;
          delete obj.StudentID;

          if(notificationsfinal && notificationsfinal.length){
            let index = notificationsfinal.findIndex(ele => {
              return ele.Month == month;
            })
  
              if(index != -1){
                notificationsfinal[index].Notifications.push(obj);
                notificationsfinal[index].Notifications = (_.sortBy(notificationsfinal[index].Notifications, 'createdAt')).reverse();
              }else{
                notificationsfinal.push({
                  Month : month,
                  Notifications : [obj]
                })
              }
          }else{
            notificationsfinal.push({
              Month : month,
              Notifications : [obj]
            })
          }
          
          return;
        }, function(err){
          if(err) return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR}); 
          return res.status(200).json({ResponseCode : 200, Data : notificationsfinal, Message : "Notification list"});
        })
      }else{
        return res.status(200).json({ResponseCode : 200, Data : [], Message : "No notifications available"})
      }
    }else{
      return res.status(404).json({ResponseCode : 404, Data : [], Message : "Parent not found"})
    }
  }catch(err){
    console.log(err)
    return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
  }
  
 }


module.exports = parentsController;
