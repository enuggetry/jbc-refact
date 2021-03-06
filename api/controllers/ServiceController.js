/* eslint-disable curly */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */

/**
 * @module
 * @description
 * REST interfaces for Service model.
 * 
 * See Service model
 * 
 * **Subscribe to Service events:**
 * ::
 *   io.socket.get('/service', function(resData, jwres) {console.log(resData);});
 *   io.socket.on('service', function(event){
 *      consol.log(event);
 *   }
 * 
 */

module.exports = {
    
    // overrides settings in config/blueprints.js
    /*
    _config: {
      actions: true,
      shortcuts: true,
      rest: true
    },
    */
   
    /**
     * Enumerate job services (jservices)
     * 
     * ``GET /service/get``
     * 
     * @param {object} req - request
     * @param {object} res - response
     * 
     */
    get: function(req,res) {
        var params = req.allParams();
        // istanbul ignore else
        if (req.method === 'GET') {


            (async() => {
                try {
                    let foundItems = await Service.Get(params);
                    if (foundItems.length===0) return res.notFound();
                    return res.ok(foundItems);
                }
                catch (err) {
                    return res.serverError({err:err});
                }
            })();
        } 
        else 
            return res.forbidden('requires POST');
    },
    /**
     * RESTful execution of a job service function.
     * 
     * ``GET or POST /service/exec/``
     * 
     * This example calls set_filter, a JBlast operation: 
     * ::
     *   var postData = {
     *         filterParams: data,
     *         asset: "jblast_sample",
     *         dataset: "sample_data/json/volvox"
     *   }
     *   $.post( "/service/exec/set_filter", postData , function( data) {
     *       console.log( data );
     *   }, "json");
     * 
     * The returned data depends on the service function that is called.
     * 
     * @param {type} req - request
     * @param {type} res - response
     * 
     */
    exec: serviceProc.execute
};

