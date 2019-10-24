/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module hooks/jbcore
 * @description
 * publish globals in a well known location
 */
const fs = require("fs-extra");

const apiroute = '/api';
const kueroute = '/kue';
const apiregex = new RegExp('^' + apiroute + '(/|$)');
const kueregex = new RegExp('^' + kueroute + '(/|$)');

module.exports = function (sails) {
    var mySails = sails; 
    
    return {

        initialize: async function() {
            sails.log.info('Initializing jbconnectHook'); 

            // define sleep(ms) function
            const sleep = m => new Promise(r => setTimeout(r, m));
            sails.exiting = false;

            //sails.on('hook:orm:loaded', async function() {
            //sails.on('lifted', async function() {
            sails.on('ready', async function() {


                // initialize data in sails.config.jbconnect
                jbutillib.initJbconnectData();
                jbutillib.initKue();

                await sleep(1000);
                await Service.Init();
                //await Job.Init();
                //await Dataset.Init();
                //await Track.Init();

            
                sails.log.info("Done initializing jbconnectHook");
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
                },
            },
            after: {
                /**
                 * kue api - access with /api
                 * 
                 * @param {*} req 
                 * @param {*} res 
                 * @param {*} next 
                 */
                'get /api/*': function (req, res, next) {
                    sails.log.debug(req.url);
                    let kue = sails.config.kue.kue;
                    req.url = req.url.replace(apiregex, '/');
                    return kue.app(req,res,next);
                },
                /**
                 * kue-ui - debugging interface for kue access with /kue
                 * 
                 * @param {*} req 
                 * @param {*} res 
                 * @param {*} next 
                 */
                'get /kue/*': function (req, res, next) {
                    sails.log.debug(req.url);
                    let kue_ui = sails.config.kue.ui;
                    req.url = req.url.replace(kueregex, '/');
                    return kue_ui.app(req,res,next);
                }        
            }
        }
    };
};
