var UglifyJS = require('uglify-js');


function buildCreateStatement(entity) {
    var query = [entity.primary + ' INTEGER PRIMARY KEY NOT NULL'];
    Object.keys(entity.properties).map(function(property) {
        var prop = entity.properties[property];
        console.log(prop);
        var type = prop.type + (('length' in prop) ? '(' + prop.length + ')' : '');
        var nil = ('not_null' in prop) ? ' NOT NULL' : ' NULL';
        query.push(property + ' ' + type + nil);
    });

    return ["CREATE TABLE ",
        entity.table,
        "(", query.join(', '), ")"
    ].join("");
}

function buildFieldsArray(entity) {
    var fields = Object.keys(entity.properties);
    fields.unshift(entity.primary);
    return fields;
}


function outputEntity(entity) {

    console.log("\nEntity info:");
    util = require('util');
    console.log(util.inspect(entity));
    var indexes = [];
    Object.keys(entity.properties).map(function(property) {
        if (entity.properties[property].index === true) {
            indexes.push(property);
        }
    });
    var properties = {
        table: entity.table,
        primary: entity.primary,
        fields: buildFieldsArray(entity),
        createStatement: buildCreateStatement(entity),
        defaultValues: {},
        indexes: indexes,
        migrations: {}
    };
    var code = ["function " + entity.name + "() { CRUD.Entity.call(this);} ", "",
        "CRUD.define(" + entity.name + ", " + util.inspect(properties) + ",{});"
    ].join("\n");

    var ast = UglifyJS.parse(code);
    var stream = UglifyJS.OutputStream({
        beautify: true
    });
    ast.print(stream);
    console.log(stream.toString());
}

/**
 * - find foreign entities to modify
 * - inject foreign keys where needed
 * - output changes to foreign entity
 */
function injectForeignProperties() {

}

/**
 * - iterate foreign entities to modify
 * - find foreign entities to modify
 * - modify relations property and add entity and type to list where needed
 * - write changes to entity to file
 */
function injectForeignRelations() {

}

/**
 * - iterate foreign entities to modify
 * - fetch existing createstatement property and modify it with new property
 * - fetch migrations property if it exists (otherwise create it)
 * - find highest migration number
 * - increment migration number and generate migration query
 * - modify migrations property with new migration
 * - write changes to entity to file
 */
function generateForeignMigrations() {

}

module.exports = {
    generateForeignMigrations: generateForeignMigrations,
    injectForeignProperties: injectForeignProperties,
    injectForeignRelations: injectForeignRelations,
    buildCreateStatement: buildCreateStatement,
    buildFieldsArray: buildFieldsArray,
    outputEntity: outputEntity
};