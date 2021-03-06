"use strict";

/*
 * Purpose: To Manage Schema of Payments
 * Author : Gravityloft
*/

const mongoose   = require('mongoose'),
      { Schema } = mongoose;

const paymentsSchema = new Schema({
    TransactionID: { type: String, required: false},
    PaidToAccountID: { type: String, required: false},
    RazorPayOrderID: { type: String, required: false},
    RazorPayJsonResponse: { type: Object, required: false},
    TransferPaymentRazorPayRouteJsonResponse: { type: Object, required: false},
    FeeID: { type: Schema.ObjectId, required: true },	
    ParentID: { type: Schema.ObjectId, required: true },
    StudentID: { type: Schema.ObjectId, required: true },
    Amount: { type: Number, required: true},
    Status: { type: String, enum : ['Failed', 'Pending', 'Success'] },
});

paymentsSchema.set('timestamps', true);

module.exports.PaymentsModel = mongoose.model('Payments', paymentsSchema);
