"use strict";

/*
 * Purpose: For manage custom functions
 * Author : Gravityloft
 */

const bcrypt = require('bcrypt'),
      ip     = require('ip'),
      globalConstant = require('../config/globalConstant'),
      datetime = require('../lib/datetime'),
      saltRounds = 10; // data processing time

/* Require Enviornment File  */
require('dotenv').config();

let helper = {

	  /**
     * To app logs
    */
    appLogs: (key, value) => {
        if (process.env.IS_APP_LOGS == 1) {
          console.log(key, value);
        }
    },

    /**
     * To capitalize string
    */
    capitalizeString: (str) => {
        return str.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },

    /**
     * To get last segment of url/string
    */
   lastSegmentOfUrl: (str) => {
        return str.substr(str.lastIndexOf('/') + 1);
    },

    /**
     * To remove value from one dimensional array
    */
   removeValueFromOneDArr: (array,value) => {
      let index = array.indexOf(value);
      if (index > -1) {
        array.splice(index, 1);
      }
      return array;
    },

    /**
     * To generte unique number
     * @param {string} n
     */
    generateRandomNo(n) {
        let low = 100000;
        let high = 999999;
        var finalNumber = Math.floor(Math.random() * (high - low + 1) + low);
        if (parseInt(finalNumber.length) < parseInt(n)) {
            var finalNumber = this.generateRandomNo(n);
        }
        return finalNumber;
    },

    /**
     * To parse number value
     * @param {number} number
     */
    parseNumber(number) {
        if (number != "" && number != null && number != undefined) {
            if (Number.isInteger(number)) {
                return number; // INTEGER
            } else {
                return parseFloat(parseFloat(number).toFixed(2)); // FLOAT
            }
        } else {
            return 0;
        }
    },

    /**
     * To get offset
     * @param {integer} pageNo 
     * @param {integer} limit 
     */
    getOffset(pageNo, limit = 10) {
        if (parseInt(pageNo) === 0) {
            pageNo = 1;
        }
        let offsetVal = (parseInt(pageNo) - 1) * parseInt(limit);
        return parseInt(offsetVal);
    },

    /**
     * To get unique alpha numeric string
     */
    s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    },

    /**
     * To get unique guid
     */
    getGuid() {
        return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' +
            this.s4() + '-' + this.s4() + this.s4() + this.s4();
    },

    /**
     * To get user ip address
     */
    getUserIp(name = 'private') {
        return ip.address(name);
    },

    /**
     * To get formatted date
     */
    getFormattedDate: (date) => {
        var year = date.getFullYear();
        var month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;
        var day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
        return year + '-' + month + '-' + day;
    },

    /**
     * To filter Multidimensional Array
    */
    multiArrayFilter: (Filters,DataArr) => {
        Filters.forEach(myFilter => {
            DataArr = DataArr.filter(arrayItem => eval("arrayItem." + myFilter.attribute + "== '" + myFilter.value + "'"));
        });
        return DataArr;
    },

    /**
     * To Map Multidimensional Array
    */
    mapArray: (DataArr,Fields) => {
      if(!Fields) return DataArr;
      
      return DataArr.map(Item => Fields.reduce((O, Field) => ({
        ...O,
        [ Field ]: Item[Field]
      }), {}))
    },

    /**
     * To extract particular column from array
    */
    arrayColumn: (DataArr,Column) => {
      return DataArr.map(x => x[Column])
    },

    /**
     * To get Key using value from object
    */
    getKeyByValue: (object,value) => {
      return Object.keys(object).find(key => object[key] === value);
    },

    /**
     * To generate index array using length
    */
    generateArrayFromLength: (length) => {
      let Arr = [];
      for (var i = 0; i < length; i++) {
        Arr.push(i)
      }
      return Arr;
    },

    /**
     * To Generate Hash string or password
    */
    generateHashStr: (str) => {
        return bcrypt.hashSync(str, bcrypt.genSaltSync(saltRounds));
    },

    /**
     * To Compare Hash string or password
    */
    compareHashStr: (str,hash) => {
        return bcrypt.compareSync(str, hash);
    }
};

module.exports = helper;