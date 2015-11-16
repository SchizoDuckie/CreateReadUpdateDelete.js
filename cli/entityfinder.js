var fs = require('fs'),
    Promise = require('bluebird'),
    CRUD = require('./CRUDMock').CRUD,
    exec = require('child_process').exec,
    UglifyJS = require('uglify-js');

module.exports = {
    /**
     * Find and register all CRUD entities under the base dir.
     * evaluates the files
     * @return {Promise} array of defined CRUD entities
     */
    findEntities: function() {
        return new Promise(function(resolve, reject) {
            exec("find . ! -name '" + __filename.split('/').pop() + "' -iname '*\.js' | xargs grep 'CRUD.Entity.call(this);' -isl", {
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
    },
    /**
     * Find the filenames for all CRUD entities under the base dir
     * @return {Promise} object with keys: entity names, values: filename
     */
    findEntityPaths: function() {
        return new Promise(function(resolve, reject) {
            exec("find . ! -name '" + __filename.split('/').pop() + "' -iname '*\.js' | xargs grep 'CRUD.Entity.call(this);' -isl", {
                timeout: 3000,
                cwd: process.cwd()
            }, function(err, stdout, stdin) {
                var results = stdout.trim().split('\n');
                var entities = {};

                // iterate all found js files and search for CRUD.define calls
                results.map(function(filename) {
                    if (filename.trim() == '') return;
                    var code = fs.readFileSync(filename) + '';
                    var ast = UglifyJS.parse(code);
                    ast.walk(new UglifyJS.TreeWalker(function(node) {
                        if (node instanceof UglifyJS.AST_Call && node.start.value == 'CRUD' && node.expression.property == 'define') {
                            entities[node.args[0].start.value] = filename;
                        }
                    }));
                });

                resolve(entities);
            });
        });
    },
    /**
     * Find a single CRUD.Entity's filename
     * @param  {string} entity Entity name to find
     * @return {string|undeifned} path to entity if found
     */
    findEntityPath: function(entity) {
        return this.findEntityPaths().then(function(entities) {
            return entities[entity];
        });
    }
};