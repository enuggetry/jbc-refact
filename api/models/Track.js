/* eslint-disable quotes */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */

/**
 * @module
 * @description
 * Track is a model for a list of tracks that are in the ``trackList.json``'s ``[tracks]`` section.
 * 
 * Ref: `Sails Models and ORM <http://sailsjs.org/documentation/concepts/models-and-orm/models>`_
 * 
 * Track object example:
 * ::
 *   {
 *     "dataset": 1,
 *     "path": "sample_data/json/volvox",
 *     "lkey": "DNA",
 *     "trackData": {
 *       "seqType": "dna",
 *       "key": "Reference sequence",
 *       "storeClass": "JBrowse/Store/Sequence/StaticChunked",
 *       "chunkSize": 20000,
 *       "urlTemplate": "seq/{refseq_dirpath}/{refseq}-",
 *       "label": "DNA",
 *       "type": "SequenceTrack",
 *       "category": "Reference sequence"
 *     },
 *     "createdAt": "2018-02-01T05:38:26.339Z",
 *     "updatedAt": "2018-02-01T05:38:26.339Z",
 *     "id": 1
 *   } 
 * 
 */
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    schema: false,              // schemaless
    datastore: 'inMemoryDb',    // this model is not persistent

    attributes: {
        dataset: {
            model: 'dataset',
            required: true
        },
        path: {
            type: 'string',
            required: true
        },
        lkey: {     // lkey is the tracklabel|<dataset index>  i.e. "sample_data/json/volvox|1"
            type: 'string',
            required: true,
            unique: true
        }

    },
    /**
     * 
     * @param {type} params - parameters
     * @param {type} cb - callback function
     */ 
    Init: async function(params) {
        //Track.startWatch();
        let datasets = await Dataset.find({});

        for(var i in datasets) {
            //this.Sync(datasets[i].id,{});
            await this._read(datasets[i].id);
        }
        
        return;
    },
    /*
     * Start watching trackList.json
     */
    StartWatch: function() {
        sails.log.info("Starting track watch");
        // this is wiring for the track watch - which will monitor trackList.json for changes.
        // presumably when we modify the file, we have to turn off watching so as not to trigger a circular event disaster.
        // npm watch
    },
    
    /*
     * Pause trackList.json watching
     * This is used by internal operations that change trackList.json
     * When the internal operation is complete, resumeWatch should be called.
     * 
     * @param {string} dataset
     * @returns {undefined}
     */
    
    PauseWatch: function(dataset) {
        
    },
    
    /*
     * Resume watching trackList.json
     * 
     * @param {string} dataset
     * @returns {undefined}
     */
    
    ResumeWatch: function(dataset) {
        
    },
    
    /**
     * Get list of tracks based on critera in params
     *   
     * @param {object} params - search critera
     * @param {function} cb - callback ``function(err,array)``
     * 
     */
    async Get(params) {
        let foundList = await this.find(params);
        return foundList;
    },
    /*
     * Add a track. into trackList.json and db.
     * addTrack.dataset must be defined as either int ( of db dataset id) or string (dataset string ie. ref of data = "sample_data/json/volvox")
     * addTrack.label must be defined and unique
     * dataset must exist with a physical location.
     * 
     * @param {object} track - this is a object that is essentially a track in trackList.json
     * @returns {object} lkey (ie. {lkey:"xxxx"})
     */
    Add: async function(addTrack) {
        //console.log(">>>>> TrackAdd",addTrack);
        var thisb = this;
        var g = sails.config.jbconnect;
        var ds = Dataset.Resolve(addTrack.dataset);
        var trackListPath = g.jbrowsePath + ds.path + '/' + 'trackList.json';

        // validate
        if (_.isUndefined(addTrack.dataset)) return Promise.reject(new Error("dataset not defined"));
        if (ds===null) return Promise.reject(new Error("dataset does not exist"));
        if (typeof addTrack.label !== 'string') return Promise.reject(new Error("invalid track label="+addTrack.label));
    
        Track.PauseWatch(ds.id);

        try {
            // write to track db
            var data = {
                dataset: ds.id,
                path: ds.path,
                lkey: addTrack.label+"|"+ds.id,
                trackData: addTrack
            };

            let createdTrack = await Track.create(data).fetch();
            sails.log.debug("Track.Add created:",createdTrack.id,createdTrack.lkey);

            // write to trackList.json
            var trackListData = fs.readFileSync (trackListPath);
            var config = JSON.parse(trackListData);
            config.tracks.push(addTrack);
            fs.writeFileSync(trackListPath,JSON.stringify(config,null,4));

            // announce track
            let announceTrack = _.cloneDeep(createdTrack);
            announceTrack.datasetPath = ds.path;
            Track.publish([createdTrack.id],'add', announceTrack);

            Track.ResumeWatch(ds.id);
            return createdTrack;
 
        }
        catch(err) {
            // istanbul ignore true
            if (true) {
                //sails.log.error("addTrack failed",addTrack.label,err);
                Track.ResumeWatch(ds.id);
                return Promise.reject(err.raw);
            }
        }

    },
    /*
     * 
     * @param {string} dataset - (eg: "sample_data/json/volvlx")
     * @param {string} dataset - dataset string (i.e. "sample_data/json/volvox"
     * @returns {object} track db element
     */
    Modify: async function(updateTrack) {
        var thisb = this;
        var g = sails.config.jbconnect;
        var ds = Dataset.Resolve(updateTrack.dataset);
        var trackListPath = g.jbrowsePath + ds.path + '/trackList.json';

        Track.PauseWatch(ds.id);
        
        // save track to tracklist json
        try {
          let trackListData = fs.readFileSync (trackListPath,'utf-8');
          let config = JSON.parse(trackListData);
          _modifyTrack(config.tracks,updateTrack);
          fs.writeFileSync(trackListPath,JSON.stringify(config,null,4));

          let lkey = updateTrack.label+"|"+ds.id;
          
          let updatedTrack = await Track.update({lkey:lkey},{trackData:updateTrack}).fetch();
          
          Track.publish([ds.id],'modify',updatedTrack[0]);       // announce
          Track.ResumeWatch(ds.id);
          return updatedTrack;
        }
        catch(err) {
            // istanbul ignore next
            if (true) {
                //sails.log.error("modifyTrack failed",updatedTrack.label,err);
                Track.ResumeWatch(ds.id);
                if (!err.raw)
                    return Promise.reject(err);
                return Promise.reject(err.raw);
            }
        }


        //Given tracks array, find and update the item with the given updateTrack.
        //updateTrack must contain label.
        function _modifyTrack(tracks,updateTrack) {
            for(var i in tracks) {
                if (tracks[i].label === updateTrack.label) {
                    tracks[i] = updateTrack;
                    return true;    // success
                }
            }
            return false;   // not found
        }
        
    },
    /**
     * 
     * @param {string} dataset - (eg: "sample_data/json/volvox")
     * @param {int} id - id of the item to be removed
     * @param (function) cb - callback function(err,
     */
    Remove: async function(params,cb) {
        var thisb = this;
        var g = sails.config.jbconnect;
        if (_.isUndefined(params.dataset)) return Promise.reject(new Error("dataset not defined"));
        if (_.isUndefined(params.id)) return Promise.reject(new Error("id not defined"));
        let dataSet = Dataset.Resolve(params.dataset);
        let id = params.id;

        Track.PauseWatch(dataSet.id);

        try {
            let foundTrack = await Track.findOne({id:id,path:dataSet.path});
            let key = foundTrack.lkey;
            let label = foundTrack.trackData.label;
            var trackListPath = g.jbrowsePath + dataSet.path + '/' + 'trackList.json';

            var trackListData = fs.readFileSync (trackListPath);
            var config = JSON.parse(trackListData);

            if (_removeTrack(config.tracks,label)){
              fs.writeFileSync(trackListPath,JSON.stringify(config,null,4));
              console.log("track removed from file",label,trackListPath);
            }

            let deletedTrack = await Track.destroy(id).fetch();
            Track.publish([id],'delete',deletedTrack);              // announce
            Track.ResumeWatch(dataSet.id);
            return id;
        }
        catch (err) {
            Track.ResumeWatch(dataSet.id);
            return Promise.reject(err.raw);
        }

        // Given tracks array, remove the item with the given key (which is track label)
        function _removeTrack(tracks,key){
            for(var i in tracks) {
                if (tracks[i].label === key) {
                    tracks.splice(i,1);
                    //delete tracks[i];
                    return true;    // success
                }
            }
            // istanbul ignore next
            return false;   // not found
        }
    },

    /*
     * 
     */
    _read: async function(dataset) {
        let g = sails.config.jbconnect;
        let ds = Dataset.Resolve(dataset);
        sails.log.info("Track._read dataset",ds);

        let trackListPath = g.jbrowsePath + ds.path + '/' + 'trackList.json';
        let fTracks = [];

        try {
            let trackListData = fs.readFileSync(trackListPath);
        
            fTracks = JSON.parse(trackListData).tracks;
        }
        catch(err) {
            sails.log.error(err);
        }

        for(let k in fTracks) {

            let data = {
                dataset: ds.id,
                path: ds.path,
                lkey: fTracks[k].label+'|'+ds.id,
                trackData: fTracks[k]
            };

            let newItem = null;
            try {
                newItem = await Track.create(data).fetch();
                if (newItem)
                    sails.log.info('track',newItem.id,newItem.lkey);
            }
            catch(err) {
                sails.log.error(err)
            }
        }

  }
    /**
     * Sync tracklist.json tracks with Track model (promises version) - obsolete
     * 
     * @param {string} dataset   ie. ("sample_data/json/volvox")
     * 
     */
    /*
    _Sync: function(dataset,cb) {
        var g = sails.config.jbconnect;
        let ds = Dataset.Resolve(dataset);
        console.log("Track.sync dataset",ds);

        var trackListPath = g.jbrowsePath + ds.path + '/' + 'trackList.json';

        var mTracks = {};       // model db tracks
        var fTracks = {};       // file (trackList.json) tracks

        Track.find({path:ds.path})
            .then(function(modelTracks) {
                //sails.log.debug("syncTracks modelTracks",modelTracks.length);

                for(var i in modelTracks)
                  mTracks[modelTracks[i].lkey] = modelTracks[i];

                // read file tracks
                return fs.readFile(trackListPath);
            })
            .then(function(trackListData) {
                var fileTracks = JSON.parse(trackListData).tracks;

                for(var i in fileTracks) 
                        fTracks[fileTracks[i].label+"|"+ds.id] = fileTracks[i];
                
                //ftracks = fTracks;
                let c = 0;
                for(var i in fTracks) console.log("ftracks",c++,i);
                c = 0;
                for(var i in mTracks) console.log("mtracks",c++,i, mTracks[i].id);

                deleteModelItems(mTracks,fTracks);
                addOrUpdateItemsToModel(mTracks,fTracks);
            })    
            .catch(function(err) {
                // istanbul ignore next
                sails.log.error(err);
            });

        // delete items from db if they do not exist in trackList
        function deleteModelItems(mTracks,fTracks) {
            var toDel = [];
            for(var k in mTracks) {
                if (typeof fTracks[k] === 'undefined')
                    toDel.push(mTracks[k].id);
            }
            if (toDel.length) {
              sails.log.debug("syncTracks ids to delete",toDel);
              Track.destroy({id: toDel})
                .then(function(deleted){
                  sails.log.debug("syncTracks tracks deleted:",deleted.length);
                  toDel.forEach(function(id) {
                      Track.publishDestroy(id);
                  });
                })
                .catch(function(err) {
                // istanbul ignore next
                sails.log.error("syncTracks tracks delete failed:",toDel);
                });
            }
        };
        function addOrUpdateItemsToModel(mTracks,fTracks) {
            // add or update file items to model

            for(var k in fTracks) {

              if (typeof mTracks[k] === 'undefined') {
                    //var dataset = Dataset.Resolve(ds);
                    let data = {
                        dataset: ds.id,
                        path: ds.path,
                        lkey: fTracks[k].label+'|'+ds.id,
                        trackData: fTracks[k]
                    };

                    //data = deepmerge(data,fTracks[k]);
                    //sails.log('track',k,data);
                    Track.create(data)
                    .then(function(item) {
                        sails.log.debug("syncTracks track created:",item.id,item.lkey);
                        Track.publishCreate(item);
                    })        
                    .catch(function(err) {
                        // istanbul ignore next
                        sails.log.error("syncTracks track create failed",err);
                    });
              }
              // update model if they are different
              else {
                  //var toOmit = ['id','createdAt','updatedAt','dataSet','dataset','dataSetPath','ikey'];
                  //sails.log('omit',mTracks[k].trackData);
                  if (JSON.stringify(mTracks[k].trackData) !== JSON.stringify(fTracks[k]) || mTracks[k].dataset !== ds.id || mTracks[k].path !== ds.path) {
                      Track.update({
                          path:ds.path, 
                          lkey:fTracks[k].label+'|'+ds.id
                        },{dataset:ds.id,trackData:fTracks[k]})
                      .then(function(item) {
                          // istanbul ignore else
                          if (item.length) {
                            Track.publishUpdate(0,item[0]);
                          }
                          else {
                              sails.log.error("syncTracks addOrUpdateItemsToModel failed to find", ds, fTracks[k].label);
                          }
                      })        
                      // istanbul ignore next
                      .catch(function(err) {
                          // istanbul ignore next
                          sails.log.error("syncTracks  addOrUpdateItemsToModel track update failed:",err);
                      });
                  }
              }
            }
        }
    },
    */
    
    /*
     * Save model tracks to trackList.json (obsolete?)
     * 
     * todo: dataSet should accept string or dataSet object id
     * 
     * @param {string} dataSet, if dataset is not defined, all models are committed.
     */
    /*
    Save(dataSet) {
        var g = sails.config.jbconnect;
        var trackListPath = g.jbrowsePath + dataSet.dataPath + '/' + 'trackList.json';
        //var dataSet = g.dataSet[0].dataPath;
        sails.log.debug('saveTracks('+dataSet+')');

        Track.find({dataSetPath:dataSet.path}).exec(function (err, modelTracks){
          if (err) {
            sails.log.error('modelTracks, failed to read');
            return;   // failed
          }
          sails.log.debug("modelTracks",modelTracks.length);

          var tracks = [];
          for(var k in modelTracks)
              tracks.push(modelTracks[k].trackData);

          // read trackList.json, modify, and write
          try {
            var trackListData = fs.readFileSync (trackListPath);
            var config = JSON.parse(trackListData);
            config['tracks'] = tracks;
            fs.writeFileSync(trackListPath,JSON.stringify(config,null,4));
          }
          catch(err) {
              sails.log.error("failed",trackListPath,err);
          }
        });
    },
    */
    
    
};



