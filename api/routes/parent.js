"use strict";

/*
 * Purpose : For Parents API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      mddleware  = require('../middleware/parentMiddleware'),
      parents   = require('../controllers/parentsController');

      /* Parents Routings */
      router.post('/parent/authenticate',parents.validate('authenticate'),parents.authenticate);
      router.put('/parent/update-device-details',mddleware.verifyToken,parents.validate('update_device_details'),parents.update_device_details);

module.exports = router;      