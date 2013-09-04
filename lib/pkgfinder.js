var path = require('path');
var fs = require('fs');
var parents = require('parents');

module.exports = function findPackage (basedir, cb) {
  var dirs = parents(basedir);
  (function next () {
    var dir = dirs.shift();
    if (dir === 'node_modules' || dir === undefined) {
      return cb(null, null, null);
    }
    var pkgfile = path.join(dir, 'package.json');
    readPackage(pkgfile, function (err, pkg) {
      if (err) return next()
      else cb(null, pkgfile, pkg)
    });
  })();
}

function readPackage (pkgfile, cb) {
  fs.readFile(pkgfile, function (err, src) {
    if (err) return cb(err);
    try { var pkg = JSON.parse(src) }
    catch (e) {}
    cb(null, pkg);
  });
}
