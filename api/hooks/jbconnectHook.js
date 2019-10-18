/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module hooks/jbcore
 * @description
 * publish globals in a well known location
 */
var fs = require("fs-extra");

//var kueJobMon = require('./kueJobMon');


/* 
 * launches redis however it must first be installed with 'yum install redis'
 */
/*
var RedisServer = require('redis-server');
var redisPort = 6379;
var redisServerInstance = new RedisServer(redisPort);


redisServerInstance.open(function (error) {
 
  if (error) {
    throw new Error(error);
  }
  
  console.log('redis server, port '+redisPort);
 
});
*/
module.exports = function (sails) {
    var mySails = sails; 
    
    return {

        //configure: function() {
            //sails.log("jbcore configure");
            //if (typeof sails.config.globals.jbrowse !== 'undefined') sails.log("globals.jbrowse exist");
            //if (typeof sails.config.globals.jbhooks === 'undefined') sails.config.globals.jbhooks = [];
            //sails.config.globals.jbhooks.splice(0, 0, "jbcore");
            
            //JbUtils.testFunction("called from jbcore.configure()");
        //},
        initialize: async function() {
            sails.log("Hook: jbconnectHook initialize"); 


            const sleep = m => new Promise(r => setTimeout(r, m));
            sails.exiting = false;

            sails.on('hook:orm:loaded', async function() {
            //sails.on('lifted', function() {

                await sleep(1000);
                await Service.Init();
                await Job.Init();

                //setTimeout(function() {
                //    let failed = false;
                //    await Service.Init();
/*
                    Service.Init({},function(err) {
                        if (err) {
                            failed++;
                            return cb(err);
                        }

                        Dataset.Init({},function(err){
                            if (err) {
                                failed++;
                                return cb(err);
                            }
                            Track.Init({}, function(err) {
                                if (err) {
                                    failed++;
                                    return cb(err);
                                }
                            });
                        });
                        Job.Init({},function(err) {
                            if (err) {
                                failed++;
                                return cb(err);
                            }
                        });

                    });
*/
                //    setTimeout(function() {
                //        if (!failed) return cb();
                //    },1000);
                //},1000);

            
                console.log("done initialize");
            });
            
            //return cb();
        },
        routes: {
            before: {
                /**
                 * get /jb/globals
                 * returns globals from config/globals.js
                 */
                'get /jb/globals.js': function (req, res, next) {
                    res.send(sails.config.globals.jbrowse);
                    //return next();
                },
                /**
                 *  get /jb/hooks
                 *  returns list of hooks
                 */
                'get /jb/hooks': function (req, res, next) {
                    var hlist = [];
                    for (var hook in sails.hooks) {
                        //console.log('hook:',hook);
                        hlist.push(hook);
                    }
                    res.send(hlist);
                    //return next();
                }
            }
        },
        /**
         * 
         */
        /*
        setGlobalSection: function(data,name,cb) {
            return storeInSection(data,name,cb);
        },
        */
        /*
         * intercept res.send for debugging
         * @param {type} res
         * @param {type} data
         * @returns {unresolved}
         */
        resSend(res,data) {
            sails.log.debug("******** resSend",data);
            return res.send(data);
        },
        /**
         * 
         * @param {type} eventName
         * @param {type} data
         * @returns {undefined}
         */
        sendEvent: function(eventName,data) {
            //Test.message(1, {message:eventName,data:data});
            //sails.log.debug("*** sendEvent: %s",eventName);
            sails.sockets.blast(eventName, data);
        }
    }
};

