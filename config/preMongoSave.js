/**
 * Created by 115937
 */

var mongoose = require('mongoose');
var moment = require('moment');
var topProgram = require('../app/models/topProgram').TopProgram;

topProgram.pre('save', function (next) {
    var program = this;

    program.auditLog = {};
    program.auditLog.createdUserId = "";
    program.auditLog.lastUpdatedUserId = "";
    program.auditLog.createdTime = moment().utc().local();
    program.auditLog.lastUpdatedTime = moment().utc().local();
});
