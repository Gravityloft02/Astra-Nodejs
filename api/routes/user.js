"use strict";

/*
 * Purpose : For Users API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      middleware  = require('../middleware/usersMiddleware'),
      users   = require('../controllers/usersController');

      /* Users Routings */
      router.patch(['/admin/change-password','/parent/change-password'],middleware.verifyToken,users.validate('change_password'),users.change_password); // Only update

module.exports = router;      