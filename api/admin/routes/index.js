"use strict";

/*
 * Purpose : For Admin API's Routing
 * Package : Router
 * Developed By  : Gravityloft
*/

const express = require('express'),
      router  = express.Router(),
      schools = require('../controllers/schoolsController'),
      admins  = require('../controllers/adminsController'),
      parents = require('../controllers/parentsController'),
      students= require('../controllers/studentsController');

      /* Schools Routings */
      router.post('/school/add',schools.validate('add'),schools.add);
      router.post('/school/assign',schools.validate('assign'),schools.assign);

      /* Admins Routings */
      router.post('/admin/add',admins.validate('add'),admins.add);

      /* Parents Routings */
      router.post('/parent/add',parents.validate('add'),parents.add);

      /* Students Routings */
      router.post('/student/add',students.validate('add'),students.add);
      router.post('/student/assign',students.validate('assign'),students.assign);

module.exports = router;      