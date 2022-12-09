/*
  USAGE:
  gulp
  OR: gulp --publishVersion <version number as #.#.#>
  
  example:
  gulp --publishVersion 1.2.0
*/

const gulp = require('gulp');
const args = require('gulp-args');
const map = require('map-stream');
const clean = require('gulp-clean');
const del = require('del');
const fs = require("fs"); // Or `import fs from "fs";` with ESM

const replace = require('gulp-replace');
const zip = require('gulp-zip');
let publishVersion = args.publishVersion;
let distPath;

gulp.task('build', function() {
  if(publishVersion !== undefined) {
    // Take the 'manifest.json' + 'SPRESTJSON.js' of the 'src'-folder
    gulp.src(['./src/manifest.json', './src/SPRESTJSON.js'])
    // Replace the first match of NUMBER.NUMBER.NUMBER with the current publishVersion in both files
    .pipe(replace(/(\d+)\.(\d+)\.(\d+)/, publishVersion))
    // Write the both files back to the 'src'-folder
    .pipe(gulp.dest('./src'));

    // Take the the 'package-lock.json' from root
    gulp.src(['package.json', 'package-lock.json'])
    // Replace the first match of NUMBER.NUMBER.NUMBER with the current publishVersion in both files
    .pipe(replace(/(\d+)\.(\d+)\.(\d+)/, publishVersion))
    // Write it back to the root folder
    .pipe(gulp.dest('./'));
  } else {
    publishVersion = 'latest';
  }
  
  distPath = './dist/SP-REST-JSON_' + publishVersion;
  // Check in the current dist folder already exists
  if (fs.existsSync(distPath)) {
    // Delete all folders and files in the dist folder
    del(distPath + '/**');
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
  .pipe(gulp.dest(distPath));

  // Copy all Other files (excluding the .js-files) from 'src'-folder
  // AND the 'LICENSE'-file
  // gulp.src(['./src/**', '!./src/**/*.js', 'LICENSE'])
  return gulp.src(['./src/**', '!./src/**/*.js', 'LICENSE'])
  // Write them to the current 'SP-REST-JSON_'-folder in the 'dist'-folder
  .pipe(gulp.dest(distPath));
 
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

// npm install map-stream
function logMatches(regex) {
  return map(function(file, done) {
    // file.contents.toString().match(regex).forEach(function(match) {
    //   console.log(file.path + ': ' + match);
      // let matches = file.contents.toString().match(regex);
      // console.log(file.path + ': ' + matches[0]);
      // console.log(file.path + ': ' + matches[1]);
      file.contents.toString().replace(regex, '$1' + '.1');
    // });
    done(null, file);
  });
}

gulp.task('getVer', function(){
  return gulp.src('./src/manifest.json')
    .pipe(logMatches(/"version": "(\d+\.\d+\.\d+)"/gm));
});

function incrementVersion(arrVer) {
  if(args.major) {
    arrVer[0] = String(Number(arrVer[0]) + 1);
  }
  if(args.minor) {
    arrVer[1] = String(Number(arrVer[1]) + 1);
  }
  if(args.patch) {
    arrVer[2] = String(Number(arrVer[2]) + 1);
  }
  const strVer = arrVer.join('.');
  return strVer;
}


gulp.task('clean', function() {
  return del(distPath + '/*.*');
});

gulp.task('updateVersion', function() {
  if(args.major || args.minor || args.patch) {
    let strVer;
    return gulp.src('./src/manifest.json')
    .pipe(replace(/"version": "\d+\.\d+\.\d+"/, function(match){
      const arrVer = match.split(/[\."]/);
      const lenArrVer = arrVer.length;
      for(let i = lenArrVer; i >= 0; i--) {
        if(arrVer[i] === '' || isNaN(Number(arrVer[i]))) {
          arrVer.splice(i, 1);
        }
      }
      strVer = incrementVersion(arrVer);
      gulp.src('./src/SPRESTJSON.js')
      .pipe(replace(/\d+\.\d+\.\d+/, strVer))
      .pipe(gulp.dest('./src'));

      return '"version": "' + strVer + '"';
    }))
    .pipe(gulp.dest('./src'));
  } else {
    console.log('Please use gulp updateVersion with one or more or all of this options:');
    console.log('--major --minor --patch');
    return Promise.resolve('the value is ignored');
  }
});
