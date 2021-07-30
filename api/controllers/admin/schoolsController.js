"use strict";

/*
 * Purpose : For Schools Management
 * Package : Schools
 * Developed By  : Gravityloft
*/

const async = require("async"),
      mongoose = require("mongoose"),
      constant = require('../../../config/globalConstant'),
      states = require('../../../data/states.json'),
      datetime = require('../../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const checkBody = check(['body']);
const {SchoolsModel} = require("../../models/schoolsModel");
const {AdminsModel} = require("../../models/adminsModel");
const {SchoolClassesModel} = require("../../models/schoolClassModel");
const {SchoolAdminModel} = require("../../models/schoolAdminModel");
const {FeesModel} = require("../../models/feesModel");

let schoolsController = {validate,add,assign}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
           case 'add': {
              return [ 
                    check('Name').notEmpty().withMessage('School Name field is required').trim().escape(),
                    check('Address').notEmpty().withMessage('Address field is required').trim().escape(),
                    check('State').notEmpty().withMessage('State field is required').trim().custom(val => {   
                       if (!states.includes(val)){
                         throw new Error('Invalid state.');
                       }
                       return true
                    })
                 ]
           }
           break;
           case 'assign': {
              return [ 
                    check('AdminID').notEmpty().withMessage('Admin ID field is required').trim().custom(val => {   
                      return AdminsModel.findOne({ _id: val}).select({"_id": 1}).exec().then(admin => {
                        if (!admin) {
                          return Promise.reject('Invalid Admin ID.');
                        }
                        return Promise.resolve(true);
                      });
                    }),
                    check('SchoolID').notEmpty().withMessage('School ID field is required').trim().custom(val => {   
                      return SchoolsModel.findOne({ _id: val}).select({"_id": 1}).exec().then(school => {
                        if (!school) {
                          return Promise.reject('Invalid School ID.');
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
      For Add School
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

      if(!req.body.ClassAcademics){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'ClassAcademics field is required.'});
      }
      let ClassAcademics = req.body.ClassAcademics;
      for (var i = 0; i < ClassAcademics.length; i++) {
        if(!ClassAcademics[i].AcademicYear){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'AcademicYear field is required.'});
        }else if(!ClassAcademics[i].Std){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Standard field is required.'});
        }else if(!ClassAcademics[i].Division){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Division field is required.'});
        }else if(!ClassAcademics[i].FeeAmount){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'FeeAmount field is required.'});
        }
      }

      /* Save School */
      let SchoolModelObj = new SchoolsModel({Name:req.body.Name,Address:req.body.Address,State:req.body.State});
      let School = await SchoolModelObj.save();
      if(School._id){

        let SchoolClassIDs = [];
        for (var i = 0; i < ClassAcademics.length; i++) {

          /* Save School Classes */
          let SchoolClassesModelObj = new SchoolClassesModel({ClassID:ClassAcademics[i].Std,SchoolID:School._id,AcademicYear:ClassAcademics[i].AcademicYear,Std:ClassAcademics[i].Std,Division:ClassAcademics[i].Division});
          let SchoolClass = await SchoolClassesModelObj.save();
          SchoolClassIDs.push(SchoolClass._id);

          /* Save Fees */
          let FeesModelObj = new FeesModel({ClassID:SchoolClass._id,SchoolID:School._id,Amount:ClassAcademics[i].FeeAmount,DueDate:(req.body.DueDate || datetime.addTime(3,'months'))});
          await FeesModelObj.save();
        }

        return res.status(200).json({ResponseCode: 200, Data: {SchoolID:School._id,SchoolClassIDs:SchoolClassIDs}, Message: 'School created successfully.'});
      }else{
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

  /**
      For Assign School
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

      /* To check If Admin is already assigned */
      var IsAdminAssigned = await SchoolAdminModel.findOne({ AdminID: mongoose.Types.ObjectId(req.body.AdminID)}).select({"_id": 1}).limit(1).exec();
      if(IsAdminAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Admin already assigned.'});
      }

      /* To check If School is already assigned */
      var IsSchoolAssigned = await SchoolAdminModel.findOne({ SchoolID: mongoose.Types.ObjectId(req.body.SchoolID)}).select({"_id": 1}).limit(1).exec();
      if(IsSchoolAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'School already assigned.'});
      }

      /* Assign Admin & School */
      let SchoolAdminModelObj = new SchoolAdminModel({AdminID:mongoose.Types.ObjectId(req.body.AdminID),SchoolID:mongoose.Types.ObjectId(req.body.SchoolID),ValidTill:(req.body.ValidTill || datetime.addTime(1,'years'))});
      SchoolAdminModelObj.save()
      .then((school) => {
        if(school._id){

          return res.status(200).json({ResponseCode: 200, Data: [], Message: 'School & admin assigned successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
  }


module.exports = schoolsController;