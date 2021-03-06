/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module
 * @description
 * Dataset is a model that represents the JBrowse dataset.  Generally, this includes
 * path to the dataset and some of the data contained in trackList.json.
 * 
 * Datasets known to JBConnect are defined in config/globals.js
 * (see: :ref:`jbs-globals-config`)
 * 
 * Dataset object:
 * ::
 *   {
 *     "name": "Volvox",
 *     "path": "sample_data/json/volvox",
 *     "createdAt": "2018-02-01T05:38:26.320Z",
 *     "updatedAt": "2018-02-01T05:38:26.320Z",
 *     "id": 1
 *   }
 *      
 * Ref: `Sails Models and ORM <http://sailsjs.org/documentation/concepts/models-and-orm/models>`_
 */

module.exports = {
    schema: false,              // schemaless
    datastore: 'inMemoryDb',    // this model is not persistent

    attributes: {
        name: {
            type: 'string'
        }, 
        path: {
            type: 'string',
            unique: true,
			required: true
        }
    },
    /*
     * cached assoc array of datasets {path:"sample_data/json/volvox", id:1}
     * is indexed by both id and path.
     */
    _dataSets: {},
    
    /**
     * Initializes datasets as defined in config/globals.js.
     * (see: :ref:`jbs-globals-config`)
     * @param {object} params - callback function 
     * @param {function} cb - callback function 
     * @returns {undefined}
     */
    Init(params,cb) {
        this.Sync(cb);
        
        // todo: need to handle this in callback
        //cb();
    },
    /**
     * Get list of tracks based on critera in params
     *   
     * @param {object} params - search critera (i.e. ``{id: 1,user:'jimmy'}`` )
     * @param {function} cb - callback ``function(err,array)``
     */
    async Get(params) {
        let foundItems = await this.find(params);
        return foundItems;
    },
    /**
     * Given either a dataset string (ie. "sample_data/json/volvox" or the database id of a dataset,
     * it returns a dataset object in the form:
     * 
     * ::
     *     
     *     {
     *         path: "sample_data/json/volvox",
     *         id: 3
     *     }
     *
     * 
     * @param {val} dval - dataset string (ie. "sample_data/json/volvox") or id (int)
     * 
     *      
     * Code Example
     * ::
     *     {
     *         path: "sample_data/json/volvox",
     *         id: 3
     *     }
     *
     * @returns {object} - dataset object
     *      dataset (string - i.e. "sample_data/json/volvox" if input was an id
     *      returns null if not found
     *
     */
    Resolve(dval){
        if (typeof this._dataSets[dval] !== 'undefined')
            return this._dataSets[dval];
        sails.log.error('Dataset.Resolve not found (we shouldnt get here)',dval);
        return null;
    },
    Init: async function(params) {
        let thisb = this;
        await this._read(params);

        /*
        let promise = new Promise((resolve, reject) => {
            thisb._sync(params,(err) => {
                if (err) reject(new Error(err));
                else resolve();
            });
        });
        */
    },
    /**
     * read configured datasets from config file.
     * @param {*} params 
     */
    
    _read: async function(params) {
        sails.log.info('Dataset sync');

        if (! sails.config.jbconnect.dataSet) return (new Error('dataSet section not defined in globals'));

        var g = sails.config.jbconnect;

        // convert to assoc array in confItems
        for(let i in g.dataSet) {
            
            //todo: validate path exists

            let item = {name: i,path: g.dataSet[i].path};

            try {
                let newItem = await Dataset.create(item).fetch();
                newItem = _.omit(newItem, ['createdAt', 'updatedAt']);
                this._dataSets[newItem.path] = newItem;
                this._dataSets[newItem.id] =   newItem;
                sails.log.info(">> dataset",newItem);
            }
            catch(err) {
            }
        }
    },
    /**
     * Sync datasets, defined in globals with database.
     * 
     * todo: need to improve, perhaps use async?
     * 
     * @param (function) cb - callback function
     */
    _sync(cb) {
        sails.log.info('Dataset sync');

        if (! sails.config.jbconnect.dataSet) return cb('dataSet section not defined in globals');

        var g = sails.config.jbconnect;
        var thisb = this;

        // this will be an assoc array referenced by dataset id and path
        //g.datasets = {};

        // these will be associative arrays
        var modelItems = {};                    // Dataset db items
        //sails.log('g.dataSet',g.dataSet);

        // convert to assoc array in confItems
        for(var i in g.dataSet) {
            thisb._dataSets[g.dataSet[i].path] = g.dataSet[i];
            thisb._dataSets[g.dataSet[i].path].name = i;
        }

        Dataset.find({}, function(err,mItems) {
            /* istanbul ignore if */
            if (err) {
                cb(err);
                return;
            }
            // convert to assoc array in modelItems
            for( var i in mItems) modelItems[mItems[i].path] = mItems[i];

            async.each(thisb._dataSets,function(item,cb1) {
                //console.log('item',item,modelItems);
                /* istanbul ignore else */
                if (typeof modelItems[item.path] !== 'undefined') {     

                    thisb._dataSets[item.path].id = modelItems[item.path].id;
                    thisb._dataSets[item.id] = thisb._dataSets[item.path];

                    Track.Sync(item.path);

                    updateItem(item,function(){});

                    return cb1();
            }
                // dataset is confItems, not in model Items --> add dataset to db
                else {
                    data = item;
                    Dataset.create(data,function(err, newDataset) {
                        if (err) {
                            var msg = 'failed to create dataset (it may exists) = path '+i;
                            console.log(msg);
                            return cb1(err);
                        }

                        data.id = newDataset.id;
                        
                        // create two refs
                        thisb._dataSets[data.id] = data;
                        thisb._dataSets[data.path] = data;

                        sails.log("Dataset.create",data);

                        Track.Sync(data.path);

                        Dataset.publish([data.id],'add',newDataset);
                        
                        return cb1();
                    });
                }
            },function asyncEachDone(err) {
                /* istanbul ignore if */
                if (err) {
                    sails.log.error("asyncEachDone failed",err);
                    return cb(err);
                }
                deleteItems(function(err) {
                    return cb(err);
                });
                
            });
            
            function updateItem(data,updatecb) {
                Dataset.update({id:data.id},data)
                .then(function(updated) {
                    return updatecb();
                })
                .catch(function(err) {
                    return updatecb(err);
                });
            }    
                    
            // delete datasets if they dont exist in config
            function deleteItems(deletecb) {
                async.each(modelItems,function(item, cb) {
                    if (typeof thisb._dataSets[item.path] === 'undefined') {
                        //sails.log('deleting dataset',j);

                        /* istanbul ignore next  */
                        Dataset.destroy(item.id,function(err) {
                            /* istanbul ignore else  */
                            if (err) {
                                sails.log.error('Dataset.destroy failed - id=',item.id);
                                return cb(err);
                            }
                            sails.log("Dataset.destroy",item.id);
                            // notify listeners
                            Dataset.publish([item.id],'delete',item);   // announce
                            return cb();
                        });
                    }
                }, 
                /* istanbul ignore next */ 
                function(err) {
                    if (err) {
                        sails.log.error("deleteItems failed");
                        //return cb(err);
                    }
                    return deletecb(err);
                });
            }
        });
    }
};

