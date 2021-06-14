"use strict";

/*
 * Purpose : For Schools Management
 * Package : Schools
 * Developed By  : Gravityloft
*/

const async = require("async"),
      constant = require('../../../config/globalConstant'),
      states = require('../../../data/states.json'),
      datetime = require('../../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {SchoolsModel} = require("../models/schoolsModel");
const {AdminsModel} = require("../models/adminsModel");
const {SchoolClassesModel} = require("../models/schoolClassModel");
const {SchoolAdminModel} = require("../models/schoolAdminModel");

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
                    }),
                    check('ClassID').trim(),
                    check('AcademicYear').trim(),
                    check('Std').trim(),
                    check('Division').trim()
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
                    check('ValidTill').notEmpty().withMessage('Valid till field is required').trim().custom(val => {   
                      if (!datetime.validateDateTime(val,'YYYY-MM-DD')){
                       throw new Error('Invalid Date Or format, It should be (YYYY-MM-DD)');
                      }else if(!datetime.isFutureDate(val,'YYYY-MM-DD')){
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

      let SchoolModelObj = new SchoolsModel({Name:req.body.Name,Address:req.body.Address,State:req.body.State});
      SchoolModelObj.save()
      .then((school) => {
        if(school._id){

          /* Save School Classes */
          let SchoolClassesModelObj = new SchoolClassesModel({ClassID:(req.body.ClassID || 13),SchoolID:school._id,AcademicYear:(req.body.AcademicYear || '2021-22'),Std:(req.body.Std || 'Test'),Division:(req.body.Division || 'A')});
          SchoolClassesModelObj.save();

          return res.status(200).json({ResponseCode: 200, Data: {SchoolID:school._id}, Message: 'School created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
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
      var IsAdminAssigned = await SchoolAdminModel.findOne({ AdminID: req.body.AdminID}).select({"_id": 1}).limit(1).exec();
      if(IsAdminAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Admin already assigned.'});
      }

      /* To check If School is already assigned */
      var IsSchoolAssigned = await SchoolAdminModel.findOne({ SchoolID: req.body.SchoolID}).select({"_id": 1}).limit(1).exec();
      if(IsSchoolAssigned){
        return res.status(500).json({ResponseCode: 500, Data: [], Message: 'School already assigned.'});
      }

      /* Assign Admin & School */
      let SchoolAdminModelObj = new SchoolAdminModel({AdminID:req.body.AdminID,SchoolID:req.body.SchoolID,ValidTill:req.body.ValidTill});
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