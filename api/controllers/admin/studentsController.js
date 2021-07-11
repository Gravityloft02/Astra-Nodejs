"use strict";

/*
 * Purpose : For Students Management
 * Package : Students
 * Developed By  : Gravityloft
*/

const async = require("async"),
      constant = require('../../../config/globalConstant'),
      datetime = require('../../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {StudentsModel} = require("../../models/studentsModel");
const {StudentClassModel} = require("../../models/studentClassModel");
const {ParentsModel} = require("../../models/parentsModel");
const {ParentStudentModel} = require("../../models/parentStudentModel");

let studentsController = {validate,add,assign}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'add': {
              return [ 
                    check('Name').notEmpty().withMessage('School Name field is required').trim().escape(),
                    check('Address').notEmpty().withMessage('Address field is required').trim().escape(),
                    check('DOB').notEmpty().withMessage('Date of birth field is required').trim(),
                    check('SchoolClassID').notEmpty().withMessage('School Class ID field is required').trim().escape()
                 ]
           }
           break;
           case 'assign': {
              return [ 
                    check('ParentID').notEmpty().withMessage('Parent ID field is required').trim().custom(val => {   
                      return ParentsModel.findOne({ _id: val}).select({"_id": 1}).exec().then(parent => {
                        if (!parent) {
                          return Promise.reject('Invalid Parent ID.');
                        }
                        return Promise.resolve(true);
                      });
                    }),
                    check('StudentID').notEmpty().withMessage('Student ID field is required').trim().custom(val => {   
                      return StudentsModel.findOne({ _id: val}).select({"_id": 1}).exec().then(student => {
                        if (!student) {
                          return Promise.reject('Invalid Student ID.');
                        }
                        return Promise.resolve(true);
                      });
                    }),
                    check('ValidTill').optional().trim().custom(val => {   
                      if (val && !datetime.validateDateTime(val,'YYYY-MM-DD')){
                       throw new Error('Invalid Date Or format, It should be (YYYY-MM-DD)');
                      }else if(val && !datetime.isFutureDate(val,'YYYY-MM-DD')){
                        throw new Error('Valid till date should be future date.');
                      }
                      return true
                    })
                 ]
           }
           break;
        }
  }

  /**
      For Add Student
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

      /* To Validate Unique Name */
      try {
        var IsName = await StudentsModel.findOne({ Name: req.body.Name}).select({ "Name": 1, "_id": 0}).limit(1).exec();
        if(IsName){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Student name number already exists !'});
        }
      } catch (err) {
        console.log('err',err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }

      let StudentModelObj = new StudentsModel({Name:req.body.Name,Address:req.body.Address,DOB:req.body.DOB});
      StudentModelObj.save()
      .then((student) => {
        if(student._id){

          /* Save Student Class */
          let StudentClassModelObj = new StudentClassModel({SchoolClassID:req.body.SchoolClassID,StudentID:student._id});
          StudentClassModelObj.save();

          return res.status(200).json({ResponseCode: 200, Data: {StudentID:student._id}, Message: 'Student created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        console.log(error)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
  }

  /**
      For Assign Student
  **/
  async function assign(req, res) {
    
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

      /* To check If Parent is already assigned */
      var IsParentAssigned = await ParentStudentModel.findOne({ ParentID: req.body.ParentID}).select({"_id": 1}).limit(1).exec();
      if(IsParentAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Parent already assigned.'});
      }

      /* To check If Student is already assigned */
      var IsStudentAssigned = await ParentStudentModel.findOne({ StudentID: req.body.StudentID}).select({"_id": 1}).limit(1).exec();
      if(IsStudentAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Student already assigned.'});
      }

      /* Assign Parent & Student */
      let StudentParentModelObj = new ParentStudentModel({ParentID:req.body.ParentID,StudentID:req.body.StudentID,ValidTill:(req.body.ValidTill || datetime.addTime(1,'years'))});
      StudentParentModelObj.save()
      .then((student) => {
        if(student._id){

          return res.status(200).json({ResponseCode: 200, Data: [], Message: 'Student & parent assigned successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
  }


module.exports = studentsController;