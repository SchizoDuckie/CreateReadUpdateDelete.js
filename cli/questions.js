var Promise = require('bluebird'),
    inquirer = require('inquirer'),
    pluralize = require('pluralize'),
    entityFinder = require('./entityfinder'),
    entity = require('./entity').entity,
    aOrAn = require('articles').articlize,
    ucFirst = require('./ucfirst').ucFirst;
/**
 * Return anything not promise as a promise similar to angular's $q.when
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

var questions = {
    askEntityName: function() {
        return promisePrompt({
            type: "input",
            name: "entityName",
            message: "Please name your entity (singular)",
        });
    },
    askIndex: function(property) {
        return promisePrompt({
            type: "confirm",
            name: "createIndex",
            message: "Create an INDEX on this property?",
            default: false
        }).then(function(results) {
            entity.properties[property.property].index = results.createIndex;
            return property;
        });
    },
    askLength: function(property) {
        var noLength = ["DATE", "DATETIME", "TEXT", "BLOB"];

        if (noLength.indexOf(property.type) > -1) {
            return promiseWrap(property);
        } else {
            return promisePrompt({
                type: "input",
                name: "length",
                message: "Length",
                default: property.type == 'VARCHAR' ? 250 : 1
            }).then(function(results) {
                entity.properties[property.property].length = results.length;
                return property;
            });
        }
    },

    askAutoserialize: function(property) {
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
    },
    askProperty: function() {
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
    },
    askAnotherProperty: function() {
        return promisePrompt({
            type: "confirm",
            name: "askAgain",
            message: "Want to add another property? ",
            default: true
        }).then(function(results) {
            return (results.askAgain) ? questions.addProperty() : entity;
        });
    },


    /**
     * Kick off the promise chain that asks the questions to add a new property
     * - input property name
     * - ask for length if applies
     * - ask to autoserialize if applies
     * - ask to create index if applies
     * - ask to add another property if applies (recurse)
     * Returns a promise that resolves when answer to askAnotherProperty is no
     */
    addProperty: function() {
        return this.askProperty()
            .then(this.askLength)
            .then(this.askAutoserialize)
            .then(this.askIndex)
            .then(this.askAnotherProperty);
    },

    addRelations: function() {
        return promisePrompt({
            type: "confirm",
            name: "addRelation",
            message: "Do you want to add a relation to another entity?"
        }).then(function(answer) {
            if (answer.addRelation) {
                var chosen = null;
                return entityFinder.findEntities()
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
                                        "1:many\n\t" + ucFirst(aOrAn(relation.name)) + " has many " + pluralize.plural(entity.name),
                                        "many:1\n\t" + ucFirst(aOrAn(entity.name)) + " has many " + pluralize.plural(relation.name),
                                        'many:many\n\tA connecting ' + entity.name + '_' + relation.name + ' entity will be generated that has a foreign key to both ' + entity.name + " and " + relation.name
                                    ]
                                });
                            })
                            .then(function(type) {
                                entity.relations[chosen] = type.relationType;
                                return questions.addRelations();
                            });
                    });
            } else {
                return promiseWrap(entity);
            }
        });
    }


};


module.exports = questions;