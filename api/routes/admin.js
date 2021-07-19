"use strict";

/*
 * Purpose : For Admin API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      schools = require('../controllers/admin/schoolsController'),
      admins  = require('../controllers/admin/adminsController'),
      parents = require('../controllers/admin/parentsController'),
      students= require('../controllers/admin/studentsController'),
      middleware = require('../middleware/usersMiddleware');

      /* Schools Routings */
      router.post('/school/add',schools.validate('add'),schools.add);
      router.post('/school/assign',schools.validate('assign'),schools.assign);
      
      /* Admins Routings */
      router.post('/admin/add',admins.validate('add'),admins.add);
      router.post('/authenticate',admins.validate('authenticate'),admins.authenticate);
      router.post('/send-notification', middleware.verifyToken,admins.sendNotification);

      /* Parents Routings */
      router.post('/parent/add',parents.validate('add'),parents.add);

      /* Students Routings */
      router.post('/student/add',students.validate('add'),students.add);
      router.post('/student/assign',students.validate('assign'),students.assign);

module.exports = router;      