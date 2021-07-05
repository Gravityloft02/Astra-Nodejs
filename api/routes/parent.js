"use strict";

/*
 * Purpose : For Parents API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      middleware  = require('../middleware/parentsMiddleware'),
      parents   = require('../controllers/parentsController');

      /* Parents Routings */
      router.post('/parent/authenticate',parents.validate('authenticate'),parents.authenticate);
      router.patch('/parent/update-device-details',middleware.verifyToken,parents.validate('update_device_details'),parents.update_device_details); // Only update
      router.post('/parent/fee-initiate',middleware.verifyToken,parents.validate('fee_initiate'),parents.fee_initiate); 

module.exports = router;      