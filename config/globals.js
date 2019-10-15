/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on any of these options, check out:
 * https://sailsjs.com/config/globals
 */

const approot = require('app-root-path');
const jbPath = approot + "/node_modules/@gmod/jbrowse/";
const jblib = require(approot+"/api/services/jbutillib");

var g = {

    jbrowse: {
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
            //'nothingBurgerService': {name: 'nothingBurgerService',  type: 'service'}
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
    },

  /****************************************************************************
  *                                                                           *
  * Whether to expose the locally-installed Lodash as a global variable       *
  * (`_`), making  it accessible throughout your app.                         *
  *                                                                           *
  ****************************************************************************/

  _: require('@sailshq/lodash'),

  /****************************************************************************
  *                                                                           *
  * This app was generated without a dependency on the "async" NPM package.   *
  *                                                                           *
  * > Don't worry!  This is totally unrelated to JavaScript's "async/await".  *
  * > Your code can (and probably should) use `await` as much as possible.    *
  *                                                                           *
  ****************************************************************************/

  async: require('async'),

  /****************************************************************************
  *                                                                           *
  * Whether to expose each of your app's models as global variables.          *
  * (See the link at the top of this file for more information.)              *
  *                                                                           *
  ****************************************************************************/

  models: true,

  /****************************************************************************
  *                                                                           *
  * Whether to expose the Sails app instance as a global variable (`sails`),  *
  * making it accessible throughout your app.                                 *
  *                                                                           *
  ****************************************************************************/

  sails: true,

};

if (jblib && jblib.mergeConfigJs) {
  g = jblib.mergeConfigJs(g);
}

module.exports.globals = g;
