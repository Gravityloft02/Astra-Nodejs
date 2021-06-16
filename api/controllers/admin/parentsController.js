"use strict";

/*
 * Purpose : For Parents Management
 * Package : Parents
 * Developed By  : Gravityloft
*/

const async = require("async"),
      constant = require('../../../config/globalConstant'),
      helper = require('../../../lib/helper'),
      datetime = require('../../../lib/datetime'),
      { check, matches,validationResult, matchedData } = require('express-validator');

const {ParentsModel} = require("../../models/parentsModel");
const {UsersModel} = require("../../models/usersModel");

let parentsController = {validate,add}

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
                check('Password').trim()
               ]
           }
           break;
        }
  }

  /**
      For Add Parent
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
        var IsPhoneNumber = await UsersModel.findOne({ Phone: req.body.Phone}).select({ "Phone": 1, "_id": 0}).limit(1).exec();
        if(IsPhoneNumber){
          return res.status(500).json({ResponseCode: 500, Data: [], Message: 'Phone number already registered !'});
        }
      } catch (err) {
        console.log('err',err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }

      /* Save Parent */
      let ParentModelObj = new ParentsModel({Name:req.body.Name,Address:req.body.Address,Phone:req.body.Phone,DOB:req.body.DOB});
      try {
        let Parent = await ParentModelObj.save();
        if(Parent._id){

          /* Save User Entry */
          let HashPassword = await helper.generateHashStr(req.body.Password||req.body.Phone);
          let UserModelObj = new UsersModel({Phone:req.body.Phone, Password:HashPassword});
          UserModelObj.save();

          return res.status(200).json({ResponseCode: 200, Data: {ParentID:Parent._id}, Message: 'Parent created successfully.'});
        }else{
          return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
        }
      } catch (err) {
        console.log('err',err)
        return res.status(500).json({ResponseCode: 500, Data: [], Message: constant.GLOBAL_ERROR});
      }
  }

module.exports = parentsController;