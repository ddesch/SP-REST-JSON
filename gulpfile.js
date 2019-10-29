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
    // Take the 'manifest.json' and the 'SPRESTJSON.js' of the 'src'-folder
    src(['./src/manifest.json', './src/SPRESTJSON.js'])
    // Replace the first match of NUMBER.NUMBER.NUMBER with the current publishVersion in both files
    .pipe(replace(/(\d+)\.(\d+)\.(\d+)/, publishVersion))
    // Write the both files back to the 'src'-folder
    .pipe(dest('./src'));
    
    // Take all .js files of the 'src'-folder
    src(['./src/**/*.js'])
    // Replace all console.log lines
    .pipe(replace(/console\.log.*/gm, ''))
    // Replace all comments
    .pipe(replace(/\/\/\s.*/gm, ''))
    // Replace all empty lines
    .pipe(replace(/^\s*\n/gm, ''))
    // Write the files to the current 'SP-REST-JSON_' folder in the 'dist'-folder
    .pipe(dest('./dist/SP-REST-JSON_' + publishVersion));

    // Copy all Other files (excluding the .js-files) from 'src'-folder
    // AND the 'LICENSE'-file
    src(['./src/**', '!./src/**/*.js', 'LICENSE'])
    // Write them to the current 'SP-REST-JSON_' folder in the 'dist'-folder
    .pipe(dest('./dist/SP-REST-JSON_' + publishVersion));

    zipping();
  }
  done();
}

zipping = function() {
  // Take all files of the current 'SP-REST-JSON_' folder in the 'dist'-folder and the 'LICENSE' file
  return src(['./dist/SP-REST-JSON_' + publishVersion + '/**'])
    // Zip them to the matching 'SP-REST-JSON_' zip-file
    .pipe(zip('SP-REST-JSON_' + publishVersion + '.zip'))
    // And save the .zip-file in the dist foler
    .pipe(dest('./dist'));
};