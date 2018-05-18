/*
 Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 Code distributed by Google as part of the polymer project is also
 subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

// Include promise polyfill for node 0.10 compatibility
require('es6-promise').polyfill();

// Include Gulp & tools we'll use
var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var path = require('path');
var historyApiFallback = require('connect-history-api-fallback');
var props = require('properties');
var url = require('url');
var proxy = require('proxy-middleware');
var plumber = require('gulp-plumber');
var util = require('gulp-util');

var buildProps = null;

var src = '.';
var DIST = '.';
var dist = function(subpath) {
	return !subpath ? DIST : path.join(DIST, subpath);
};

/**
 *  Standard error handler, for use with the plumber plugin or on() function.
 */
function handleError(error) {
	console.log("Error (ending current task):", error.message);
	this.emit("end"); //End function
	process.exit(1);
}

/** Configures proxy for use with BrowserSync. The getBuildProperties task must be called first. */
function getProxies() {
	var apiHost = buildProps.apiHost;
	var apiProxyOptions;
	var namesProxyOptions;
	var domCfgProxyOptions;
	if (apiHost) {
		apiProxyOptions = url.parse('http://' + apiHost + '/api');
		apiProxyOptions.route = '/api';
		apiProxyOptions.cookieRewrite = apiHost;

		namesProxyOptions = url.parse('http://' + apiHost + '/names.nsf');
		namesProxyOptions.route = '/names.nsf';
		namesProxyOptions.cookieRewrite = apiHost;

		domCfgProxyOptions = url.parse('http://' + apiHost + '/domcfg.nsf');
		domCfgProxyOptions.route = '/domcfg.nsf';
		domCfgProxyOptions.cookieRewrite = apiHost;

		return [proxy(apiProxyOptions), proxy(domCfgProxyOptions),
			proxy(namesProxyOptions), historyApiFallback()
		];
	}
}

// Get the properties
gulp.task('getBuildProperties', function(callback) {
	props.parse('build.properties', {path: true}, function(err, obj) {
		buildProps = obj;
		util.log(util.colors.magenta('build.properties loaded!'));
		callback(err);
	});
});

// Watch files for changes & reload
gulp.task('serve', ['getBuildProperties'], function() {

	browserSync({
		port: 5000,
		notify: false,
		logPrefix: 'PSK',
		// logLevel: 'debug',
		logConnections: true,
		snippetOptions: {
			rule: {
				match: '<span id="browser-sync-binding"></span>',
				fn: function(snippet) {
					return snippet;
				}
			}
		},
		// Run as an https by uncommenting 'https: true'
		// Note: this uses an unsigned certificate which on first access
		//       will present a certificate warning in the browser.
		// https: true,
		server: {
			baseDir: ['.tmp', '.'],
			routes: {
				'/': 'bower_components/'
			},
			index: 'index.html',
			directory: true,
			middleware: getProxies()
		}
	});

	// gulp.watch(['*.html'], reload);
	gulp.watch([
			'{' + src + ',demo,test}/**/*.html'
		],
		reload);
	gulp.watch([src + '/styles/**/*.css'], reload);
	gulp.watch([src + '/images/**/*'], reload);
});

// Load tasks for web-component-tester
// Adds tasks for `gulp test:local` and `gulp test:remote`
require('web-component-tester').gulp.init(gulp);
