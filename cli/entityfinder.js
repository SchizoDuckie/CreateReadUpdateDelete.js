var fs = require('fs'),
    Promise = require('es6-promise').Promise,
    CRUD = require('./CRUDMock').CRUD,
    exec = require('child_process').exec;
/**
 * Find a list of all defined CRUD entities in the current directory so we can use them for hooking up relations
 */
module.exports = {
    findEntities: function() {
        return new Promise(function(resolve, reject) {
            exec("find . ! -name '" + __filename.split('/').pop() + "' -iname '*js' | xargs grep 'CRUD.Entity.call(this);' -isl", {
                timeout: 3000,
                cwd: process.cwd()
            }, function(err, stdout, stdin) {
                var results = stdout.trim().split('\n');
                for (var i = 0; i < results.length; i++) {
                    eval(fs.readFileSync(results[i]) + '');
                }
                resolve(Object.keys(CRUD.entities));
            });
        });
    }
};