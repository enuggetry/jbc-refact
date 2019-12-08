/* eslint-disable curly */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */

/**
 * @module
 * @description
 * REST interfaces for JobActive model.
 * 
 * See: JobActive model.
 * 
 * **Subscribe to JobActive events:**
 * ::
 *   io.socket.get('/jobactive', function(resData, jwres) {console.log(resData);});
 *   io.socket.on('jobactive', function(event){
 *      consol.log(event);
 *   }
 *   
*/


module.exports = {
    /**
     * Read job active record
     * 
     * ``GET /jobactive/get``
     * 
     * @param {object} req - request
     * @param {object} res - response
     */
    get: function(req,res) {
        var params = req.allParams();
        /* istanbul ignore else */
        if (req.method === 'GET') {

            (async() => {
                try {
                    let foundItems = await JobActive.Get(params);
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
	
};
