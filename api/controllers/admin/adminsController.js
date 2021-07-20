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
      notification = require('../../../lib/notification'),
      { check, matches,validationResult, matchedData } = require('express-validator'),
      _ = require("underscore");

const {AdminsModel} = require("../../models/adminsModel");
const {UsersModel} = require("../../models/usersModel");
const {SchoolAdminModel} = require("../../models/schoolAdminModel");
const {FeesModel} = require("../../models/feesModel");
const {SchoolClassesModel} = require("../../models/schoolClassModel");
const {StudentClassModel} = require("../../models/studentClassModel");
const {ParentStudentModel} = require("../../models/parentStudentModel");
const {ParentsModel} = require("../../models/parentsModel");
const {NotificationsModel} = require("../../models/notificationsModel");
const {SchoolsModel} = require("../../models/schoolsModel");

/* Require Enviornment File  */
require('dotenv').config();

let adminsController = {validate,add,authenticate, sendNotification, getNotifications}

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

        /* Get Admin School */
        var AdminSchoolObj = await SchoolAdminModel.findOne({ AdminID: AdminObj._id}).select({"_id": 0, "SchoolID" : 1}).limit(1).exec();
        if(!AdminSchoolObj){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'There is no school assigned yet !'});
        }

        /* Get Admin School Fees */
        var AdminSchoolFeesArr = await FeesModel.find({ SchoolID: AdminSchoolObj.SchoolID}).select({"ClassID": 1, "Amount" : 1}).exec();

        /* Get Students */
        var StudentsArr = await SchoolClassesModel.aggregate([
                          { "$lookup": {
                              "from": "student-classes",
                              "localField": "studentclasses.SchoolClassID",
                              "foreignField": "_id",
                              "as": "studentclasses"
                          } },    
                          { "$lookup": {
                              "from": "students",
                              "localField": "students.StudentID",
                              "foreignField": "studentclasses.SchoolID",
                              "as": "students"
                          } },
                          { "$lookup": {
                              "from": "payments",
                              "localField": "payments.StudentID",
                              "foreignField": "students._id",
                              "as": "payments"
                          } },

                          { "$match": { "SchoolID": (AdminSchoolObj.SchoolID).toString()}},
                          { "$project": {
                              "_id" : 0,
                              "StudentID" : { "$arrayElemAt" : ["$students._id", 0] },
                              "StudentName" : { "$arrayElemAt" : ["$students.Name", 0] },
                              "ClassID" : 1,
                              "AcademicYear" : 1,
                              "Std" : 1,
                              "Division" : 1,
                          } }
                       ]).exec();

        /* Generate Token */
        let RespObj = {};
            RespObj.Token = jwt.sign({UserID:UserObj._id, AdminID:AdminObj._id, UserType : 'Admin'}, process.env.TOKEN_SECRET, { expiresIn: '36000s' }); // 600 minutes
            RespObj.SchoolID = AdminSchoolObj.SchoolID;
            RespObj.Fees = AdminSchoolFeesArr;
            RespObj.Students = StudentsArr;
        return res.status(200).json({ResponseCode: 200, Data: RespObj, Message: 'success'});
      } catch (err) {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /* 
      For Sending Notification From Admin
  */

  async function sendNotification(req, res) {
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

        if(!req.body.NotificationSubject){
          return res.status(400).json({ResponseCode: 400, Data: [], Message: "Notification Subject is required"});
        }

        if(!req.body.NotificationContent){
          return res.status(400).json({ResponseCode: 400, Data: [], Message: "Notification Content is required"});
        }

        if(req.body.TargetClassID && req.body.TargetClassID.length < 0){
          return res.status(400).json({ResponseCode: 400, Data: [], Message: "Target Class ID is required"});
        }

        if(!req.body.SchoolID){
          return res.status(400).json({ResponseCode: 400, Data: [], Message: "School ID is required"});
        }

        // let ClassDetails = await SchoolClassesModel.findOne({_id : req.body.TargetClassID});
        let ClassDetails = await SchoolClassesModel.find({ClassID : {$in : req.body.TargetClassID}, SchoolID : req.body.SchoolID});
        
        if(ClassDetails && ClassDetails.length <= 0){
          return res.status(404).json({ResponseCode: 404, Data: [], Message: "Student not found for this classes"});
        }

        let ClassIDs = _.pluck(ClassDetails, '_id');

        let StudentClass = await StudentClassModel.find({SchoolClassID : {$in : ClassIDs}});

        if(StudentClass && StudentClass.length <= 0){
          return res.status(404).json({ResponseCode: 404, Data: [], Message: "Student not found for this classes"});
        }

        // let SchoolDetails = await SchoolsModel.findOne({_id : ClassDetails.SchoolID});

        let student_ids = _.pluck(StudentClass, "StudentID");

        let ParentStudent = await ParentStudentModel.find({StudentID : {$in : student_ids}});

        if(ParentStudent && ParentStudent.length <- 0){
          return res.status(404).json({ResponseCode: 404, Data: [], Message: "Parent not associated with student"});
        }
        
        let parent_ids = _.pluck(ParentStudent, 'ParentID');

        let Parents = await ParentsModel.find({_id : {$in : parent_ids}});

        if(Parents && Parents.length <= 0){
          return res.status(404).json({ResponseCode: 404, Data: [], Message: "No parents available"});
        }

        let devices = _.pluck(Parents, "DeviceKey");

        notification.sendNotification(req.body, devices);

        let notificationObj = {
          AdminID: req.body.UserID,
          TargetClassID: req.body.TargetClassID,
          SchoolID : req.body.SchoolID,
          NotificationSubject : req.body.NotificationSubject,
          NotificationContent : req.body.NotificationContent,
          StudentID : student_ids
        }

        let notifications = await NotificationsModel.create(notificationObj)

        let response = {
          SchoolID : req.body.SchoolID,
          AdminId: req.body.UserID,
          NotificationId : notifications._id,
          TargetClassID : req.body.TargetClassID,
          TargetDivision : _.pluck(ClassDetails, "Division"), //ClassDetails.Division,
          ClassID: ClassIDs,
          NotificationSubject : req.body.NotificationSubject,
          NotificationContent : req.body.NotificationContent
        }

        return res.status(200).json({ResponseCode: 200, Data: response, Message : "Notification sent"})
      }catch(err) {
        console.log(err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
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

      let limit = req.query.Limit? Number(req.query.Limit) : 50; 
      let offset = req.query.Offset? Number(req.query.Offset) : 0; 

      let notifications = await NotificationsModel.find({AdminID : req.body.UserID}).select({NotificationSubject : 1, NotificationContent : 1, createdAt : 1}).sort({"createdAt": -1}).limit(limit).skip(offset);

      if(notifications && notifications.length){
          return res.status(200).json({ResponseCode : 200, Data : notifications, Message : "Notification list"});
      }else{
        return res.status(200).json({ResponseCode : 200, Data : [], Message : "No notifications available"})
      }
    
  }catch(err){
    return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
  }
  
 }


module.exports = adminsController;