"use strict";

/*
 * Purpose: To Manage Schema of Notifications
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const notificationsSchema = new Schema({
    AdminID: { type: String, required: true },
    TargetClassID: [{ type: String, required: true }],
    SchoolID: { type: String, required: true },
    NotificationSubject : {type : String, required: true},
    NotificationContent : {type : String, required: true},
    StudentID : [{type : String, required: true, ref : "Students"}]
});

notificationsSchema.set('timestamps', true);

module.exports.NotificationsModel = mongoose.model('Notifications', notificationsSchema);
