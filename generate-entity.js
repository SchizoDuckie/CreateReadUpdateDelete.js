var inquirer = require("inquirer"),
    pluralize = require('pluralize'),
    fs = require('fs'),
    grep = require('simple-grep'),
    exec = require('child_process').exec

// file is included here:
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

var starterQuestions = [{
    type: "input",
    name: "entityName",
    message: "Please name your entity (singular)",

}];

var propertyQuestions = [{
    type: "input",
    name: "property",
    message: "Add a property"
}, {
    type: "list",
    name: "type",
    message: "What's the type?",
    choices: [
        "RELATION",
        "VARCHAR",
        "INT",
        "TINYINT",
        "SMALLINT",
        "MEDIUMINT",
        "BIGINT",
        "DATE",
        "DATETIME",
        "TEXT",
        "BLOB",
        "DOUBLE",
        "FLOAT",
        "DECIMAL",

    ]
}];

var noLength = ["DATE", "DATETIME", "TEXT", "BLOB"];

var metaQuestions = [{
    type: "confirm",
    name: "createIndex",
    message: "Create an INDEX on this property?",
    default: false
}, {
    type: "confirm",
    name: "autoSerialize",
    message: "Auto-Serialize this property? (Say yes if you plan to put objects or arrays in this property)",
    default: false
}, {
    type: "confirm",
    name: "askAgain",
    message: "Want to add another property? ",
    default: true
}];

var entity = {
    properties: {}
};

var ucFirst = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

function askMetaQuestions(property) {
    inquirer.prompt(metaQuestions, function(results) {
        entity.properties[property].autoSerialize = results.autoSerialize;
        entity.properties[property].index = results.createIndex;

        if (results.askAgain) {
            addProperty();
        } else {
            console.log("\nEntity info:");
            console.log(JSON.stringify(entity, null, "  "));
        }
    });
}

function askLength(property) {
    inquirer.prompt({
        type: "input",
        name: "length",
        message: "Length",
        default: 1
    }, function(results) {
        entity.properties[property].length = results.length;
        askMetaQuestions(property);
    });
}


function addProperty() {
    inquirer.prompt(propertyQuestions, function(results) {
        entity.properties[results.property] = {
            type: results.type
        };

        if (noLength.indexOf(results.type) == -1) {
            askLength(results.property);
        } else {
            askMetaQuestions(results.property);
        }

    });
}

inquirer.prompt(starterQuestions, function(answers) {
    entity.name = ucFirst(answers.entityName);
    entity.table = ucFirst(pluralize.plural(entity.name));
    entity.primary = 'ID_' + entity.name;
    addProperty();
});