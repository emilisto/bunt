var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs.extra');
var util = require('util')
var _ = require('underscore')

var through = require('through');
var browserify = require('browserify');
var brfs = require('brfs');
var async = require('async');
var concat = require('concat-stream');
var CombinedStream = require('combined-stream');
var glob = require('glob');

var findPackage = require('./lib/pkgfinder');

function findDependencies(entry) {
  var seen = {};
  var b = browserify();
  b.add(path.resolve(entry));
  var depstream = b.deps({});

  return depstream.pipe(through(function(dep) {
      var out = this;

      findPackage(path.dirname(dep.id), function(err, pkg, pkgfile) {
        if(err) return out.emit('error', err);

        if(!pkgfile.bunt) return;
        if(seen[pkg]) return;

        seen[pkg] = true;
        out.queue({ pkg: pkg, pkgfile: pkgfile });
      });
    }))
};

function build(entry, opts, buildCb) {

  opts = opts || {};

  // FIXME: on errors, call `buildCb` with the error

  if(_.isFunction(opts)) {
    buildCb = opts;
    opts = {};
  }

  var buildDir = path.resolve('build');

  findPackage(path.resolve(entry), function(err, _pkg, _pkgfile) {

    var rootPackage = _pkgfile;

    console.log('Building %s\n', rootPackage.name);

    async.waterfall([

      function cleanBuildDirectory(cb) {
        console.log('  - cleaning build directory');
        fs.rmrf(buildDir, function() {
          fs.mkdir(buildDir, cb);
        });
      },

      function buildDependencies(cb) {
        findDependencies(entry).pipe(concat(function(deps) {
          var tasks = deps.map(function(dep) {
            return buildOne.bind(null, dep);
          });
          async.parallel(tasks, cb);
        }))
      },

      function concatenateCss(_, cb) {
        console.log('  - concatenating stylesheets');

        // options is optional
        glob(path.join(buildDir, "**/*.css"), function (er, files) {
          var combinedStream = CombinedStream.create();
          combinedStream.append('/* Styles concatenated using bunt */\n');

          // FIXME: preserve order of concatenated stylesheets files - the
          // top-level ones should go last, so they override nested ones.
          files.forEach(function(file) {
            var name = path.basename(path.dirname(file));
            if(name === 'build') name = rootPackage.name;

            combinedStream.append(util.format('\n/* BEGIN styles for "%s" */\n', name));
            combinedStream.append(fs.createReadStream(file));
            combinedStream.append(util.format('\n/* END styles for "%s" */\n', name));
          });

          combinedStream.pipe(fs.createWriteStream(path.join(buildDir, '_style.css')));
          combinedStream.on('end', function(err) {
            if(err) return cb(err);
            fs.rename(
              path.join(buildDir, '_style.css'),
              path.join(buildDir, 'style.css'),
            cb);
          });
        })
      },

      function buildIndex(cb) {
        var out = fs.createWriteStream('build/index.js');
        entry = path.resolve(entry);
        var b = browserify();
        b.transform(brfs);
        b.add(entry);
cb
        var bundle = b.bundle({
          debug: !!opts.debug,
          standalone: opts['global-name'] || rootPackage.name
        });
        bundle
          .on('error', cb)
          .on('end', cb)
          .pipe(out);
      },
      function done() {
        // TODO: print total bundle size and list of assets
        console.log('\nAll done! Bundled bunt and dependencies are in ./%s',
            path.relative(process.cwd(), buildDir));

        if(buildCb) buildCb();
      }

    ]);

  });


  function buildOne(bunt, cb) {
    var dir = path.dirname(bunt.pkg),
        pkgname = bunt.pkgfile.name;

    console.log('  - building assets for "%s" in %s', pkgname, dir);

    async.series([
      function prepublish(cb) {
        var child = exec('npm run-script prepublish', {
          cwd: dir
        }, function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          cb();
        });
      },
      function copyAssets() {
        var dst = path.join(buildDir, pkgname),
            pkgBuildDir = path.join(path.dirname(bunt.pkg), 'build');

        if(pkgBuildDir === buildDir) return cb();

        fs.copyRecursive(pkgBuildDir, dst, cb);
      }
    ]);


    // TODO:
    // 1. create a directory A in the build/ directory for the bunt
    // 2. run `npm prepublish` and copy all resulting assets to the directory
    // created in 1.
  }

};

module.exports = {
  findDependencies: findDependencies,
  build: build
};
