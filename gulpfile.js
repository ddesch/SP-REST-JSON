/*
  USAGE: gulp --publishVersion <version number>
  example: gulp --publishVersion 1.2.0
*/
const { src, dest } = require('gulp');
const args = require('gulp-args');
const replace = require('gulp-replace');
const zip = require('gulp-zip');
const publishVersion = args.publishVersion;
 
exports.default = function(done) {
  if(publishVersion !== undefined) {
    src(['./src/manifest.json', './src/SPRESTJSON.js'])
    .pipe(replace(/(\d+)\.(\d+)\.(\d+)/, publishVersion))
    .pipe(dest('./src/'));
  }
  zipping();
  done();
}

zipping = function() {
    return src(['./src/**', 'LICENSE'])
        .pipe(zip('SP-REST-JSON_' + publishVersion + '.zip'))
        .pipe(dest('dist'));
};