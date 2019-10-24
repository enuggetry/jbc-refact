/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
const approot = require('app-root-path');
const jbPath = approot + "/node_modules/@gmod/jbrowse/";
const jblib = require(approot+"/api/services/jbutillib");

module.exports.jbconnect = {
    
    jbrowseRest: "http://localhost:1337",
    jbrowsePath: jbPath,                        // or "/var/www/jbrowse/"
    routePrefix: "jbrowse",                     // jbrowse is accessed with http://<addr>/jbrowse
    
    /*
     * Datasets
     * (paths relative the JBrowse directory)
     */
    dataSet: {
        Volvox: {
           path: "sample_data/json/volvox",
           featureMapping: 'query'
        }
    },

      // default dataset after successful login (optional.  if not defined then the first dataSet is used)
      defaultDataSet: "Volvox",
    
    // job service registration
    services: {
        'nothingBurgerService': {name: 'nothingBurgerService',  type: 'service'}
    },
    
    /*
     * Web Includes
     * These includes are injected into JBrowse upon sails lift (see tasks/pipeline.js).
     */
    webIncludes: {
        "css-bootstrap":         {lib: "/jblib/bootstrap.min.css"},
        "css-mbextruder":        {lib: "/jblib/mb.extruder/mbExtruder.css"},
        "css-jqueryui":          {lib: "/jblib/jquery-ui.min.css"},
        "css-jqueryuistructure": {lib: "/jblib/jquery-ui.structure.min.css"},
        "css-jqueryuitheme":     {lib: "/jblib/jquery-ui.theme.min.css"},
        "js-sailsio":            {lib: "https://cdn.jsdelivr.net/npm/sails.io.js-dist@1.1.13/sails.io.min.js"},
        "js-jquery":             {lib: "/jblib/jquery.min.js" },
        "js-jqueryui":           {lib: "/jblib/jquery-ui.min.js" },
        "js-bootstrap":          {lib: "/jblib/bootstrap.min.js"},
        "js-mbextruderHover":    {lib: "/jblib/mb.extruder/jquery.hoverIntent.min.js"},
        "js-mbextruderFlip":     {lib: "/jblib/mb.extruder/jquery.mb.flipText.js"},
        "js-mbextruder":         {lib: "/jblib/mb.extruder/mbExtruder.js"}
    },
    excludePlugins: {
        //"ServerSearch": true    // doesn't work with JBrowse 1.13.0+
    }

}
