var inquirer = require("inquirer"),
    pluralize = require('pluralize'),
    fs = require('fs'),
    grep = require('simple-grep'),
    exec = require('child_process').exec,
    Promise = require('es6-promise').Promise;


/**
 * CRUD mock object that captures definitions
 * @type {Object}
 */
var CRUD = {
    entities: {},
    define: function(proto, definition) {
        CRUD.entities[proto.prototype.constructor.name] = definition;
    }
};
/**
 * Find a list of all defined CRUD entities in the current directory so we can use them for hooking up relations
 */
function findEntities() {
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

var entity = {
    properties: {},
    relations: {}
};

var ucFirst = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Return aything not promise as a promise similar to angular's $q.when
 */
function promiseWrap(something) {
    return new Promise(function(resolve) {
        resolve(something);
    });
}

/**
 * Convert inquirer.prompt to a promise.
 */
function promisePrompt(questions) {
    return new Promise(function(resolve, reject) {
        inquirer.prompt(questions, function(results) {
            resolve(results);
        });
    });
}

function askIndex(property) {
    return promisePrompt({
        type: "confirm",
        name: "createIndex",
        message: "Create an INDEX on this property?",
        default: false
    }).then(function(results) {
        entity.properties[property.property].index = results.createIndex;
        return property;
    });
}

function askLength(property) {
    var noLength = ["DATE", "DATETIME", "TEXT", "BLOB"];

    if (noLength.indexOf(property.type) > -1) {
        return promiseWrap(property);
    } else {
        return promisePrompt({
            type: "input",
            name: "length",
            message: "Length",
            default: 1
        }).then(function(results) {
            entity.properties[property.property].length = results.length;
            return property;
        });
    }
}

function askAutoserialize(property) {
    var canHoldSerializable = ["TEXT", "BLOB"];
    if (canHoldSerializable.indexOf(property.type) == -1) {
        return promiseWrap(property);
    } else {
        return promisePrompt({
            type: "confirm",
            name: "autoSerialize",
            message: "Auto-Serialize this property? (Say yes if you plan to put objects or arrays in this property)",
            default: false
        }).then(function(results) {
            entity.properties[property.property].autoSerialize = results.autoSerialize;
            return property;
        });
    }
}

function askProperty() {
    return promisePrompt([{
        type: "input",
        name: "property",
        message: "Enter the name of a new property to add"
    }, {
        type: "list",
        name: "type",
        message: "What's the type?",
        choices: "VARCHAR|INT|TINYINT|SMALLINT|MEDIUMINT|BIGINT|DATE|DATETIME|TEXT|BLOB|DOUBLE|FLOAT|DECIMAL".split("|")
    }]).then(function(results) {
        entity.properties[results.property] = {
            type: results.type
        };
        return results;
    });
}


function askAnotherProperty() {
    return promisePrompt({
        type: "confirm",
        name: "askAgain",
        message: "Want to add another property? ",
        default: true
    }).then(function(results) {
        return (results.askAgain) ? addProperty() : entity;
    });
}

function outputEntity(entity) {
    console.log("\nEntity info:");
    console.log(JSON.stringify(entity, null, "  "));
    return;
}

/**
 * Kick off the promise chain that asks the questions to add a new property
 * - input property name
 * - ask for length if applies
 * - ask to autoserialize if applies
 * - ask to create index if applies
 * - ask to add another property if applies (recurse)
 * Returns a promise that resolves when answer to askAnotherProperty is no
 */
function addProperty() {
    return askProperty()
        .then(askLength)
        .then(askAutoserialize)
        .then(askIndex)
        .then(askAnotherProperty);
}


function addRelations() {
    return promisePrompt({
        type: "confirm",
        name: "addRelation",
        message: "Do you want to add a relation to another entity?"
    }).then(function(answer) {
        if (answer.addRelation) {
            var chosen = null;
            return findEntities()
                .then(function(definedEntities) {
                    return promisePrompt({
                            type: "list",
                            name: "name",
                            message: "What's the target entity?",
                            choices: definedEntities
                        })
                        .then(function(relation) {
                            chosen = relation.name;
                            return promisePrompt({
                                type: "list",
                                name: "relationType",
                                message: "What type should the relation be?",
                                choices: [
                                    "1:1\n\t" + entity.name + " will have a foreign key to " + relation.name + " and vice versa",
                                    "1:many\n\t" + entity.name + " will have a foreign key to " + relation.name,
                                    "many:1\n\t" + relation.name + " will have a foreign key to " + entity.name,
                                    'many:many\n\tA connecting ' + entity.name + '_' + relation.name + ' entity will be generated that has a foreign key to both ' + entity.name + " and " + relation.name
                                ]
                            });
                        })
                        .then(function(type) {
                            entity.relations[chosen] = type.relationType;
                            return addRelations();
                        });
                });
        } else {
            return promiseWrap(entity);
        }
    });
}

function injectForeignRelations() {

}

function generateForeignMigrations() {

}


console.log([
    "------------------------------------------------",
    "   Generate a CreateReadUpdateDelete.js Entity",
    "------------------------------------------------"
].join("\n"));

promisePrompt({
    type: "input",
    name: "entityName",
    message: "Please name your entity (singular)",
}).then(function(answers) {
    entity.name = ucFirst(answers.entityName);
    entity.table = ucFirst(pluralize.plural(entity.name));
    entity.primary = 'ID_' + entity.name;
    console.log("Creating new CRUD Entity: %s\nTable: %s\nPrimary key: %s", entity.name, entity.table, entity.primary);
    return addProperty()
        .then(addRelations)
        .then(outputEntity)
        .then(injectForeignRelations)
        .then(generateForeignMigrations)
});