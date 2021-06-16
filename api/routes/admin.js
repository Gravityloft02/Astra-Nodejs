"use strict";

/*
 * Purpose : For Admin API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      middleware  = require('../middleware/userMiddleware'),
      schools = require('../controllers/admin/schoolsController'),
      admins  = require('../controllers/admin/adminsController'),
      parents = require('../controllers/admin/parentsController'),
      students= require('../controllers/admin/studentsController');

      /* Schools Routings */
      router.post('/school/add',middleware.verifyUserToken,schools.validate('add'),schools.add);
      router.post('/school/assign',schools.validate('assign'),schools.assign);

      /* Admins Routings */
      router.post('/admin/add',admins.validate('add'),admins.add);

      /* Parents Routings */
      router.post('/parent/add',parents.validate('add'),parents.add);

      /* Students Routings */
      router.post('/student/add',students.validate('add'),students.add);
      router.post('/student/assign',students.validate('assign'),students.assign);

module.exports = router;      