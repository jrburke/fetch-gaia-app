/*jshint node: true */

var fs = require('fs'),
    colors = require('colors'),
    q = require('q'),
    path = require('path'),
    cwd = process.cwd(),
    file = require('volo/lib/file'),
    download = require('volo/lib/download'),
    unzip = require('volo/lib/unzip'),
    tempDir = require('volo/lib/tempDir'),
    archive = require('volo/lib/archive'),
    nameRemoveRegExp = /[-_]/g;

colors.mode = 'console';

function generateHelp() {
  return 'Usage:\n'.bold + 'fetch-gaia-app username branchid appname\n' +
  'or\n' +
  'fetch-gaia-app url-to-app-zipfile appname\n' +
  'See README at http://github.com/jrburke/fetch-gaia-app for more info';
}

function makeAppName(url, branchId, appName) {
  if (url) {
    branchId = url.split('/').pop().replace(/\.\w+$/, '');
  }

  return branchId.toLowerCase().replace(nameRemoveRegExp, '') + '-' +
         appName.toLowerCase().replace(nameRemoveRegExp, '');
}

function main(args) {
  var d, tempDirName, archiveInfo, zipFileName, url, archiveId,
      userName = args[0],
      branchId = args[1],
      appName = args[2];

  if (!appName) {
    // Could be an HTTP URL
    if (userName && userName.indexOf(':') !== -1) {
      url = userName;
      appName = branchId;
      userName = null;
      branchId = null;
    }
  }

  // Validate args
  if ((url && !appName) || (!url && (!userName || !branchId || !appName))) {
    d = q.defer();
    d.resolve(generateHelp());
    return d.promise;
  }

  //Function used to clean up in case of errors.
  function errCleanUp(err) {
      if (tempDirName) {
          //Clean up temp area. Even though this is async,
          //it is not important to track the completion.
          file.asyncPlatformRm(tempDirName);
      }
      return err;
  }

  //Find out how to get the template
  return q.fcall(function () {
      if (!file.exists(path.join(cwd, 'apps'))) {
        throw errCleanUp(new Error('Run this command at the top of your ' +
                  'gaia checkout. This command uses the ' + 'apps'.bold +
                  ' directory to place the app.'));
      }

      archiveId = url || userName + '/gaia/' + branchId;

      return archive.resolve(archiveId, function localResolve(relativePath) {
        if (relativePath.indexOf('/') !== 0 &&
                relativePath.indexOf(':') === -1) {
            return path.resolve(cwd, relativePath);
        }
        return relativePath;
    });
  }).then(function (info) {
      //Create a tempdir to store the archive.
      archiveInfo = info;
      return tempDir.create(archiveId);
  }).then(function (tempName) {
      //Save the name for the outer errCleanUp to use later.
      tempDirName = tempName;
      zipFileName = path.join(tempDirName, 'template.zip');

      return download({
          url: archiveInfo.url,
          headers: archiveInfo.urlHeaders
      }, zipFileName);
  }).then(function () {
      if (archiveInfo.isArchive) {
          return unzip(zipFileName);
      }
      return undefined;
  }).then(function () {
      //Move the unzipped directory to the final location.
      var manifest, locales,
          firstDirName = file.firstDir(tempDirName),
          srcName = firstDirName && (url ?
                    path.join(firstDirName) :
                    path.join(firstDirName, 'apps', appName)),
          newAppName = makeAppName(url, branchId, appName),
          destName = path.join(cwd, 'apps', newAppName),
          destManifestName = path.join(destName, 'manifest.webapp');

      if (!firstDirName) {
        throw errCleanUp(new Error('Unexpected zipball configuration'));
      }

      if (!file.exists(srcName)) {
        throw errCleanUp(new Error('Cannot find ' + appName.bold +
                                   ' at ' + srcName));
      }

      //Remove existing destName if it exists
      if (file.exists(destName)) {
        file.rm(destName);
      }

      //Move the unpacked template to appName
      //Doing a copy instead of a rename since
      //that does not work across partitions.
      file.copyDir(srcName, destName);

      // Modify the webapp JSON
      if (file.exists(destManifestName)) {
        manifest = JSON.parse(file.readFile(destManifestName));

        // Update the name
        manifest.name = newAppName;
        manifest.description = newAppName;

        // And names in locale-specific info
        locales = manifest.locales;
        if (locales) {
          Object.keys(locales).forEach(function (key) {
            locales[key].name = newAppName;
            locales[key].description = newAppName;
          });
        }

        // Save the JSON
        fs.writeFileSync(destManifestName,
                         JSON.stringify(manifest, null, '  '),
                         'utf8');
      }

      //Clean up temp area. Even though this is async,
      //it is not important to track the completion.
      file.asyncPlatformRm(tempDirName);

      return 'Created ' + ('apps/' + newAppName).bold + '. Run ' +
             'make GAIA_OPTIMIZE=1 reset-gaia'.bold + ' to install on device';
  });
}

module.exports = main;
