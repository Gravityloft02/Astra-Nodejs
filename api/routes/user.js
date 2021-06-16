"use strict";

/*
 * Purpose : For Users API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      users   = require('../controllers/usersController');

      /* Users Routings */
      router.post('/user/authenticate',users.validate('authenticate'),users.authenticate);

module.exports = router;      