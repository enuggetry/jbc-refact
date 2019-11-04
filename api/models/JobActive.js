/* eslint-disable handle-callback-err */
/* eslint-disable no-trailing-spaces */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable indent */
/**
 * @module
 * @description
 * JobActive holds a count of the number of active jobs.
 * It only contains one record that gets updated when the number of active jobs changes.
 * A timer thread monitors the job queue for active jobs and updates the JobActive record
 * with any changes to the number of active jobs.
 * Subscribers to the record (clients) will get notification.
 * JBClient plugin uses this to determine if a job is active and changes the activity icon
 * of the job queue panel.
 *
 * JobActive object example:
 * ::
 *   {
 *     "active": 0,
 *     "createdAt": "2017-11-23T00:53:41.864Z",
 *     "updatedAt": "2018-02-07T07:59:32.471Z",
 *     "id": 1
 *   } 
 */


module.exports = {
    schema: false,              // schemaless
    datastore: 'inMemoryDb',    // this model is not persistent
    
    /**
     * initialize starts the job active monitor
     * 
     * @param {object} params - value is ignored
     * @param {type} cb - callback ``function cb(err)`` 
     *    
     */
    Init: function(params,cb) {
        this._activeMonitor();
        cb();
    },
    /**
     * Get list of tracks based on critera in params  
     * 
     * @param {object} params - search critera (i.e. ``{id: 1,user:'jimmy'}`` )
     * @param {function} cb - callback ``function(err,array)``
     * 
     */
    Get: function(params,cb) {
        this.find(params).then(function(foundList) {
           return cb(null,foundList); 
        }).catch( /* istanbul ignore next */ function(err){
           return cb(err);
        });
    },
    /*
     * Monitors how many active jobs there are.
     */
    _lastActiveCount: 0,
    _activeMonitor: function() {
        sails.log.info("Active Job Monitor starting");
        var g = sails.config.kue;
        var thisb = this;
        var queue = g.queue;

        queue.activeCount(Job._queueName, function( err, total ) {
            console.log("active count",total);
            thisb._lastActiveCount = total;
            writeActive(total);
        });

        let t1 = setInterval(function() {
            /* istanbul ignore next */
            if (sails.exiting) {
                console.log("clear interval _activeMonitor");
                clearInterval(t1);
                return;
            }
            
            //console.log("active mon");
            queue.activeCount(Job._queueName, function( err, total ) {
                //console.log("active count",total);
                if (total !== thisb._lastActiveCount) {
                    console.log("active job count",total);
                    thisb._lastActiveCount = total;
                    writeActive(total);
                }
            });
        },2000);
        
        function writeActive(val) {
            JobActive.updateOrCreate({id:1},{active:val}).then(function(record) {
                //sails.log('active written',record);
                JobActive.publish(1,record);    //todo: 
            })
            .catch(
            /* istanbul ignore next */
            function(err) {
                let e = (""+err).split('\n');
                // trap corner case error that occurs sometimes on npm test
                if (e[0]==="TypeError: Cannot read property 'select' of undefined")
                    return;
                sails.log('writeActive() error writing active job flag', err);
                //console.dir(err);
            });
            
        }
    },

};
