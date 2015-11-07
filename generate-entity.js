var inquirer = require("inquirer"),
    pluralize = require('pluralize'),
    fs = require('fs'),
    grep = require('simple-grep'),
    exec = require('child_process').exec,
    Promise = require('es6-promise').Promise;


eval(fs.readFileSync('src/CRUD.js') + '');
eval(fs.readFileSync('src/CRUD.SqliteAdapter.js') + '');

/**
 * Find a list of all defined CRUD entities so we can use them for hooking up relations
 */
function findEntities() {

    exec("find . -iname '*js' | xargs grep 'CRUD.Entity.call(this);' -isl", {
        timeout: 3000,
        cwd: process.cwd()
    }, function(err, stdout, stdin) {

        // split the results
        var results = stdout.split('\n');
        // remove last element (it’s an empty line)
        results.pop();

        console.log("Search results");
        for (var i = 0; i < results.length; i++) {

            console.log(results[i]);

        }
    });
}


console.log([
    "------------------------------------------------",
    "   Generate a CreateReadUpdateDelete.js Entity",
    "------------------------------------------------"
].join("\n"));

var entity = {
    properties: {}
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
        choices: "RELATION|VARCHAR|INT|TINYINT|SMALLINT|MEDIUMINT|BIGINT|DATE|DATETIME|TEXT|BLOB|DOUBLE|FLOAT|DECIMAL".split("|")
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

function addProperty() {
    return askProperty()
        .then(askLength)
        .then(askAutoserialize)
        .then(askIndex)
        .then(askAnotherProperty);
}

promisePrompt({
    type: "input",
    name: "entityName",
    message: "Please name your entity (singular)",
}).then(function(answers) {
    entity.name = ucFirst(answers.entityName);
    entity.table = ucFirst(pluralize.plural(entity.name));
    entity.primary = 'ID_' + entity.name;
    console.log("Creating new CRUD Entity: %s\nTable: %s\nPrimary key: %s", entity.name, entity.table, entity.primary);
    return addProperty().then(outputEntity);
});