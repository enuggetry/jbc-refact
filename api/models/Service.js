/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module
 * @description 
 *
 * The service module implements the job service frameowrk which are installable 
 * modules that can host web services and be a job execution processing for a particular
 * type of job.
 *
 * Installable services are generally named <servicename>Service.js and reside in the
 * api/services directory.  For example: a job service built into this project is 
 * serverSearchService.js
 *
 * `api/services/serviceProc.js` is the bettr part of the implementation of service
 *
 * Job services are defined in `config/globals.js` in the jbrowse/services section.
 *
 * Example job service object:
 * ::
 *   {
 *     "name": "serverSearchService",
 *     "type": "service",
 *     "module": "search",
 *     "createdAt": "2018-02-01T05:38:26.289Z",
 *     "updatedAt": "2018-02-07T07:59:31.430Z",
 *     "id": 1
 *   }
 *
 */

module.exports = {
    schema: false,              // schemaless
    datastore: 'inMemoryDb',    // this model is not persistent

    attributes: {

      name: {
          type: 'string',
          unique: true,
          required: true
      },
      type: {
          type: 'string',
          //enum: ['service', 'workflow'],
          required: true
      },
      // this is the origin of the service,  it can be the installable hook name (i.e. 'jblast')
      module: {
          type: 'string',
          required: true
      }
    },

    Init: function(params) {
        return new Promise((resolve, reject) => {
            serviceProc.init(params,(err) => {
                if (err) reject(new Error(err));
                else resolve();
            });
        });
    },

    /**
     * Get list of tracks based on critera in params
     *
     * @param {object} params - search critera (i.e. ``{id: 1,user:'jimmy'}`` )
     * @param {function} cb - callback ``function(err,array)``
     *
     */
    Get: async function(params) {
        let foundList = await this.find(params);
        return foundList;
    },
    /**
     * add service (promise)
     *
     * @param {object} service
     * ::
     *  {
     *      name: - unique service name
     *      type: - service ('service' or 'workflow')
     *      module: - module (ie 'jblast')
     *      alias: optional
     *      handler: - a function pointer to the service handler
     *  }
     *
     */
    Add: serviceProc.addService,
    /**
     * generic job service validation
     *
     * @param {string} serviceStr - service name
     * @returns {value}
     *
     * * return 0 if it is a valid job service (that uses the job queue)
     * * return non-zero if it is not
     *
     */
    ValidateJobService: function(serviceStr) {
        var serviceFunc = this.Resolve(serviceStr);
        if (!serviceFunc)                                       return "service name not found: "+serviceStr;
        if (typeof serviceFunc === 'undefined')                 return "undefined service";
        if (typeof serviceFunc.beginProcessing !== 'function')  return "beginProcessing function does not exist in service";
        if (typeof serviceFunc.validateParams !== 'function')   return "validateParams function does not exist in service";
        if (typeof serviceFunc.generateName !== 'function')     return "generateName function does not exist in service";
        return 0;
    },
    /*
     * Given the service name, return the service object.
     *
     * @param {string} serviceName - service name
     * @returns {value}
     *
     * * 0, if not defined
     *
     */
    Resolve: function(serviceName) {
        var svc = serviceProc.services[serviceName];
        if (typeof svc !== 'undefined') return svc;
        return null;
    }

};
