/* eslint-disable curly */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module
 * @description
 * REST Interfaces for Dataset model
 * 
 * Datasets are configure in ``config/globals.js`` file.
 * 
 * See Dataset Model
 * 
 * **Subscribe to Dataset events:**
 * ::
 *   io.socket.get('/dataset', function(resData, jwres) {console.log(resData);});
 *   io.socket.on('dataset', function(event){
 *      consol.log(event);
 *   }
 * 
 */

module.exports = {
    /**
     * Enumerate or search datasets
     * 
     * ``GET /dataset/get``
     * 
     * @param {object} req - request data
     * @param {object} res - response data
     */
    get: function(req,res) {
        var params = req.allParams();

        /* istanbul ignore else */
        if (req.method === 'GET') {
            (async() => {
                try {
                    let foundItems = await Dataset.Get(params);
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
    }
	
};

