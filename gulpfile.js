/*
  USAGE:
  gulp
  OR: gulp --publishVersion <version number as #.#.#>
  
  example:
  gulp --publishVersion 1.2.0
*/

const gulp = require('gulp');
const args = require('gulp-args');
const replace = require('gulp-replace');
const zip = require('gulp-zip');
let publishVersion = args.publishVersion;

gulp.task('build', function() {
  if(publishVersion !== undefined) {
    // Take the 'manifest.json' and the 'SPRESTJSON.js' of the 'src'-folder
    gulp.src(['./src/manifest.json', './src/SPRESTJSON.js'])
    // Replace the first match of NUMBER.NUMBER.NUMBER with the current publishVersion in both files
    .pipe(replace(/(\d+)\.(\d+)\.(\d+)/, publishVersion))
    // Write the both files back to the 'src'-folder
    .pipe(gulp.dest('./src'));
  } else {
    publishVersion = 'latest';
  }
  
  // Take all .js files of the 'src'-folder
  gulp.src(['./src/**/*.js'])
  // Replace all console.log lines
  .pipe(replace(/console\.log.*/gm, ''))
  // Replace all comments
  .pipe(replace(/\/\/\s.*/gm, ''))
  // Replace all empty lines
  .pipe(replace(/^\s*\n/gm, ''))
  // Write the files to the current 'SP-REST-JSON_' folder in the 'dist'-folder
  .pipe(gulp.dest('./dist/SP-REST-JSON_' + publishVersion));

  // Copy all Other files (excluding the .js-files) from 'src'-folder
  // AND the 'LICENSE'-file
  // gulp.src(['./src/**', '!./src/**/*.js', 'LICENSE'])
  return gulp.src(['./src/**', '!./src/**/*.js', 'LICENSE'])
  // Write them to the current 'SP-REST-JSON_'-folder in the 'dist'-folder
  .pipe(gulp.dest('./dist/SP-REST-JSON_' + publishVersion));
});

gulp.task('zip', function(){
  if(publishVersion === undefined) {
    console.log('Please use: gulp --publishVersion <number>.<number>.<number>');
    console.log('OR simply: gulp');
  } else {
    const strPath = 'SP-REST-JSON_' + publishVersion;
    console.log('zip: ' + publishVersion);
    return gulp.src('./dist/' + strPath + '/**')
      .pipe(zip(strPath + '.zip'))
      .pipe(gulp.dest('./dist'));
  }
});

gulp.task('default', gulp.series('build', 'zip'));