"use strict";

/*
 * Purpose : For Parents API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

// MONGO_DB_USER=AstraGravityloft2021
// +MONGO_DB_PASSWORD=AstraGravityloft2021Delhi
// +APP_ENV=dev

const express = require('express'),
      router  = express.Router(),
      middleware  = require('../middleware/parentsMiddleware'),
      parents   = require('../controllers/parentsController');

      /* Parents Routings60e2c4cda38e7e16476c5b65 */ 
      router.post('/parent/authenticate',parents.validate('authenticate'),parents.authenticate);
      router.patch('/parent/update-device-details',middleware.verifyToken,parents.validate('update_device_details'),parents.update_device_details); // Only update
      router.post('/parent/fee-payment-initiate',middleware.verifyToken,parents.validate('fee_initiate'),parents.fee_initiate); 
      router.patch('/parent/fee-payment-verify',middleware.verifyToken,parents.validate('fee_payment_verify'),parents.fee_payment_verify); 
      router.get('/parent/payment-history',middleware.verifyToken,parents.validate('payment_history'),parents.payment_history); 
      router.get('/parent/get-notification',middleware.verifyToken,parents.getNotifications); 

module.exports = router;      