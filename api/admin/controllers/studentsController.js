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

const {StudentsModel} = require("../models/studentsModel");
const {StudentClassModel} = require("../models/studentClassModel");

let studentsController = {validate,add}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'add': {
              return [ 
                    check('Name').notEmpty().withMessage('School Name field is required').trim().escape(),
                    check('Address').notEmpty().withMessage('Address field is required').trim().escape(),
                    check('DOB').notEmpty().withMessage('Date of birth field is required').trim().custom(dob => {  
                       if (!datetime.validateDateTime(dob,'YYYY-MM-DD')){
                         throw new Error('Invalid Date of birth Or format, It should be (YYYY-MM-DD)');
                       }else if(datetime.getUserAge(dob) < constant.MIN_AGE){
                         throw new Error('Age should be greater than or equal to '+constant.MIN_AGE);
                       }
                       return true
                    }),
                    check('ClassID').trim()
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
        var IsName = await StudentsModel.findOne({ Name: req.body.Name}).select({ "Name": 1, "_id": 0}).exec();
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
          let StudentClassModelObj = new StudentClassModel({ClassID:(req.body.ClassID || 10),StudentID:student._id});
          StudentClassModelObj.save();

          return res.status(200).json({ResponseCode: 200, Data: [], Message: 'Student created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
  }


module.exports = studentsController;