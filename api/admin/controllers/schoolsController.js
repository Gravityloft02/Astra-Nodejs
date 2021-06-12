"use strict";

/*
 * Purpose : For Schools Management
 * Package : Schools
 * Developed By  : Gravityloft
*/

const async = require("async"),
      constant = require('../../../config/globalConstant'),
      states = require('../../../data/states.json'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {SchoolsModel} = require("../models/schoolsModel");
const {SchoolClassesModel} = require("../models/schoolClassModel");

let schoolsController = {validate,add}

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
                         throw new Error('Invalid state');
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

          return res.status(200).json({ResponseCode: 200, Data: [], Message: 'School created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      })
      .catch((error) => {
        return res.status(500).json({ResponseCode: 500, Data: [], Message: error._message});
      });
  }


module.exports = schoolsController;