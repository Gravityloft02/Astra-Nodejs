"use strict";

/*
 * Purpose: To manage datetime functions
 * Author : Gravityloft
*/

const moment   = require('moment'),
      momentTz = require('moment-timezone'),
      dateTime = require('date-time'),
      dateFormat = require('dateformat');

class Datetime {

	/* Constructor */
	constructor() {
		
	}

    /**
     * To get user age
     * @param {string} userDOB
     */
    getUserAge(userDOB) {
        if (userDOB) {
            return parseInt(moment().diff(userDOB, 'years'));
        } else {
            return 0;
        }
    }

	/**
     * To convert datetime into timestamp
     * @param {string} strDate
     */
    convertToTimestamp(strDate) {
        let datum = Date.parse(strDate);
        return datum / 1000;
    }

    /**
     * To get current time
     */
    getCurrentTime() {
        return dateTime({
            local: false,
            date: new Date()
        });
    }

    /**
     * To get dates between start date & end date
     * @param {string} startDate
     * @param {string} endDate
    */
    getDatesRange(startDate, endDate) {
        var dateArray = [];
        var currentDate = moment(startDate);
        var endDate = moment(endDate);
        while (currentDate <= endDate) {
          dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
          currentDate = moment(currentDate).add(1, 'days');
        }
        return dateArray;
    }

    /**
     * To change date time format
     * @param {string} datetime 
     * @param {string} format 
     */
    changeDateFormat(datetime, format = 'yyyy-mm-dd HH:MM:ss') {
        if (datetime) {
            return dateFormat(datetime, format);
        } else {
            return '';
        }
    }

    /**
     * To validate start & end date time
     * @param {string} startDateTime 
     * @param {string} endDateTime 
     * @param {string} format 
     */
    validateStartEndDateTime(startDateTime,endDateTime, format) {
        var startTime = moment(startDateTime, format);
        var endTime   = moment(endDateTime, format);
        if(startTime.isBefore(endTime)) {
            return true;  
        } else {
            return false;  
        }
    }

    /**
     * For get datetime difference 
     * @param {datetime} startDateTime
     * @param {datetime} endDateTime
     * @param {string} diffType
     */
    getDateTimeDifference(startDateTime, endDateTime, diffType) {
        let startDate = moment(startDateTime, 'YYYY-M-DD HH:mm:ss')
        let endDate   = moment(endDateTime, 'YYYY-M-DD HH:mm:ss')
        let timeDiff  = endDate.diff(startDate, diffType);
        return parseInt(timeDiff);
    }

    /**
     * To validate date time format
     * @param {datetime} dateTime
     * @param {string} requiredFormat
     */
    validateDateTime(dateTime, requiredFormat) {
        let isValid = moment(dateTime, requiredFormat,true).isValid();
        return isValid;
    }

    /**
     * To validate date time is future or not
     * @param {datetime} dateTime
     * @param {string} requiredFormat
     */
    isFutureDate(dateTime, requiredFormat) {
        var todayDate  = moment();
        var futureDate = moment(dateTime, requiredFormat);
        if (!todayDate.isAfter(futureDate)) {
          return true;
        }else{
          return false;
        }
    }

    /**
     * To add days, hours, months & years in current date
     * @param {integer} number
     * @param {string} type
     */
    addTime(number,type,requiredFormat = 'yyyy-mm-dd') {
        return dateFormat(moment().add(number, type), requiredFormat)
    }

    /**
     * To convert into timezone
     * @param {string} timeZone 
     * @param {string} dateTime 
     */
    timezoneConversion(timeZone, dateTime) {
        let moment = require('moment-timezone');
        var finalDateTime = '';

        /* Convert to timezone string */
        let dateTimeZone = moment.tz(dateTime, timeZone).format();
        let dateArr = dateTimeZone.split(/\D/);
        var convertType = '-';
        if (dateTimeZone.indexOf("+") >= 0) {
            convertType = '+';
        }
        if (dateArr != "") {
            finalDateTime += dateArr[0] + "-" + dateArr[1] + "-" + dateArr[2] + " " + dateArr[3] + ":" + dateArr[4] + ":" + dateArr[5];
            let hourDiff = parseInt(dateArr[6]);
            let minutesDiff = parseInt(dateArr[7]);
            if (hourDiff > 0) {
                if (convertType === '+') {
                    finalDateTime = moment(finalDateTime).add(hourDiff, 'hours');
                } else {
                    finalDateTime = moment(finalDateTime).subtract(hourDiff, 'hours');
                }
            }
            if (minutesDiff > 0) {
                if (convertType === '+') {
                    finalDateTime = moment(finalDateTime).add(minutesDiff, 'minutes');
                } else {
                    finalDateTime = moment(finalDateTime).subtract(minutesDiff, 'minutes');
                }
            }
        }
        if (finalDateTime != "") {
            return this.changeDateFormat(finalDateTime);
        } else {
            return finalDateTime;
        }
    }

    /**
     * To convert time
     * @param {integer} milliseconds 
     */
    timeConversion(milliseconds) {
        var seconds = (milliseconds / 1000).toFixed(1);
        var minutes = (milliseconds / (1000 * 60)).toFixed(1);
        var hours   = (milliseconds / (1000 * 60 * 60)).toFixed(1);
        var days    = (milliseconds / (1000 * 60 * 60 * 24)).toFixed(1);
        if (seconds <= 0) {
            return milliseconds + " Milliseconds";
        }else if (seconds < 60) {
            return seconds + " Sec";
        } else if (minutes < 60) {
            return minutes + " Min";
        } else if (hours < 24) {
            return hours + " Hrs";
        } else {
            return days + " Days"
        }
    }

}

module.exports = new Datetime();

/* End of file datetime.js */
/* Location: ./lib/datetime.js */