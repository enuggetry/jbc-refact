/* eslint-disable quotes */
/* eslint-disable curly */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable handle-callback-err */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/**
 * @module
 * @description 
 * Support functions for Service model.
 */
var async = require('async');

module.exports = {
    
    /*
     * Associative array of services, keyed by service name.
     * 
     * addService() creates the items in this list, providing quick access to
     * service handlers keyed by service name.
     * 
     * Each item:  
     *      <service name>: <service handler>
     *      
     * for example:
     *      'galaxy_blast' : <func ptr to galaxyService in jblast>    
     */
    services: {},
    
    /*
     * Associative array of service names keyed by function name.
     * 
     * addService() creates the items in this list, providing quick access to
     * services given a command name.
     * 
     * If multiple services have the same command name, the earlier registrant's
     * commands will tend to dominate.  Then, the long command form should
     * be used to address a specific service's commands.
     * 
     * Short form route:
     *      /service/exec/workflow_submit
     *      
     * Long form route:
     *      /service/exec/workflow_submit:galaxy_blast
     * 
     * 
     * 
     * Each array item:
     *      <command name> : <service name>
     * 
     * for example:
     *      'workflow_submit' : 'galaxy_blast'
     */
    cmdMap:{},
    
    /**
     * initialize the job service framework
     * 
     * @param {type} params - parameters
     * @param {type} cb2 - callback
     * 
     */
    init: function(params, cb2) {
        sails.log.info("Service init");
        var thisb = this;

        if (! sails.config.jbconnect.services) return cb2('services section not defined in globals');
        
        let g = sails.config.jbconnect;
        let services = g.services;      // services defined in global.js, including hooks.
        
        Service.find({},function(err,foundServices) {


            //sails.log("services found: ");
            //for(var i in services) sails.log("service",services[i].name);
            
            _init();
            
            // load services
            function _init() {
                async.eachSeries(services, function(service,cb1) {
                    
                    if (typeof(service.enable)!=='undefined' && service.enable===false) {
                        sails.log.info("disabled service",service.name);
                        return cb1();
                    }
                    var params = {
                        name:   service.name,
                        type:   service.type,
                        module: 'self'
                    };
                    
                    // istanbul ignore next
                    if (typeof service.alias !== 'undefined')
                        params.alias = service.alias;
                    
                    var s = params;
                   
                    try {
                        params.handler = eval(service.name);
                    }
                    // istanbul ignore next 
                    catch(err) {
                        sails.log.error('Service',service.name,'not found');
                        return cb1();
                    }
                    thisb._addService(params,cb1);

                }, function completedAddingServices(err) {
                    // istanbul ignore next
                    if (err) {
                        sails.log("Services init failed:",err);
                        return cb2('Services init failed');
                    }
                    //sails.log("Services init completed");
                    
                    deleteUndefinedFromDb()                    
                    
                    return cb2();
                });
            }
            // delete undefined services in db
            function deleteUndefinedFromDb() {
                // mark undefined services for deletion
                var dbServices = {};        // assoc key by service name
                for(var i in foundServices) foundServices[i].delete = true;         // mark all deleted
                for(var i in foundServices) dbServices[foundServices[i].name] = foundServices[i]; // convert to assoc array, dbServices
                for(var i in services) {
                    if (typeof dbServices[i] !== 'undefined') delete dbServices[i].delete;
                }
                async.eachSeries(dbServices, function(service,cb1) {

                    if (service.delete) {
                        Service.destroy(service.id).then(function(destroyed) {
                            sails.log("deleteUndefinedFromDb deleted service",service.id);
                            return cb1();
                        }).catch(
                            // istanbul ignore next
                            function(err) {
                            sails.log("deleteUndefinedFromDb deleted service failed",service.id);
                            return cb1(err); 
                        });
                    }
                }, function completedAddingServices(err) {
                    // istanbul ignore next
                    if (err) {
                        sails.log("Services init failed:",err);
                        return;
                    }
                    //sails.log("Services init completed");
                });
                
            }
        });
    },
    /**
     * add a service (promise)
     * returns 0 if successful
     * 
     * @param {object} service - service
     * 
     */
    addService: function(service) {
        let thisb = this;
        return new Promise((resolve,reject) => {
            thisb._addService(service,function(ret) {
                if (!ret) resolve(0);       // success
                else reject(ret);           // fail
            });

        });

    },
    /*
     * add a service
     * returns 0 if successful
     * 
     * @param {object} service - service
     * @param {function} cb - callback
     * 
     */
    _addService: function(service,cb) {
        
        var handler = service.handler;
        var cb2 = cb;
        
        sails.log.info('addService',service.name, service.type, service.module);
        
        // istanbul ignore next
        if (typeof service.name === 'undefined') {
            sails.log.error('addService - no service name');
            return cb2('addService - no service name');
        } 
        // istanbul ignore next
        if (typeof service.handler === 'undefined') {
            sails.log.error('addService - no handler defined',service.handler);
            return cb2('addService - no handler defined');
        }
        // istanbul ignore next
        if (service.type === 'workflow') {
            if (typeof service.handler.beginProcessing === 'undefined') {
                sails.log.error('addService - handler.beginProcessing not defined',service.handler);
                return cb2('addService - handler.beginProcessing not defined');
            }
            if (typeof service.handler.beginProcessing !== 'function') {
                sails.log.error('addService - handler.beginProcessing not a function',service.handler);
                return cb2('addService - handler.beginProcessing not a function');
            }
        }
        
        // s is the copy we send to the Service db.
        var s = service;
        delete s.handler;
        
        Service.updateOrCreate({name:service.name},service).then(function(record) {
            _addService(handler,service.name);
            //sails.log('service added',service.name);
            return cb2();
        }).catch(
            // istanbul ignore next
            function(err) {
            sails.log('error adding service',service.name, err);
            return cb2(err);
        });
        
        function _addService(svc) {
            serviceProc.services[service.name] = handler;
            
            if (typeof service.alias !== 'undefined') serviceProc.services[service.alias] = handler;

            for(var cmd in handler.fmap) {
                if (typeof serviceProc.cmdMap[cmd] === 'undefined')
                    serviceProc.cmdMap[cmd] = service.name;
            }
            handler.init({},function(data) {
            });
        }
    },
    
    execute: function (req, res) {

        var serviceName = "***";
        
        //sails.log('service.execute',req.route);
        //sails.log('params',req.params,'body',req.body);
        
        // given the route /service/exec/mycmd, id will be 'mycmd', the command
        var cmdName = req.params['id'];
        
        // if it contains a ':', it is a long form command
        if (cmdName.indexOf(':') !== -1) {
            var x = cmdName.split(':');
            cmdName = x[0];
            serviceName = x[1];
        }
        else {
            // attempt to get service name from map
            serviceName = serviceProc.cmdMap[cmdName];
        }
        sails.log("service %s cmd %s",serviceName,cmdName, req.allParams());
        
        // does service exist or is it registered
        /* istanbul ignore next */
        if (typeof this.services[serviceName] === 'undefined') {
            sails.log.error('service does not exist:',serviceName);
            return res.forbidden();
        }
        // determine type of request GET/POST, etc.  Reject invalid
        var method = req.method;
        method = method.toLowerCase();
        /* istanbul ignore next */
        if (method !== this.services[serviceName].fmap[cmdName]) {
            sails.log.error('forbidden request method:',req.method,method,this.services[serviceName].fmap[cmdName]);
            return res.forbidden();
        }
        // is the command implemented
        /* istanbul ignore next */
        if (typeof this.services[serviceName].fmap[cmdName] === 'undefined' || typeof this.services[serviceName][cmdName] !== 'function') {
            sails.log.error('invalid command:',cmdName);
            return res.forbidden();
        }
        this.services[serviceName][cmdName](req,res);
        
    }
};
