/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

const kue = require('kue');
const kue_ui = require('kue-ui');

const apiroute = '/api';
const kueroute = '/kue';
const apiregex = new RegExp('^' + apiroute + '(/|$)');
const kueregex = new RegExp('^' + kueroute + '(/|$)');

kue.createQueue();
kue_ui.setup({
  apiURL: '/api', // IMPORTANT: specify the api url
  baseURL: '/kue' // IMPORTANT: specify the base url
  //updateInterval: 5000 // Optional: Fetches new data every 5000 ms
});


module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

	
    order: [
      'cookieParser',
      'session',
      'jbrowse',
      'kue',
      'compress',
      'poweredBy',
      'router',
      'www',
      'favicon',
    ],
	

    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: (function _configureBodyParser(){
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true });
    //   return middlewareFn;
    // })(),
	
    jbrowse: (function _jbrowse() {
      console.log('middleware jbrowse');
      var express = require('express');
      var jbrowsePath = '/home/ericiam/jb1166/';
      return express.static(jbrowsePath); 
    })(),
    
    kue: function (req, res, next) {

      if (req.url.match(apiregex)) {
        console.log('kue',req.method,req.url);
        req.url = req.url.replace(apiregex, '/');
        return kue.app(req,res);
      }
      if (req.url.match(kueregex)) {
        console.log('kue_ui',req.method,req.url);
        req.url = req.url.replace(kueregex, '/');
        return kue_ui.app(req,res);
      }

      return next();
    }
  },

};
