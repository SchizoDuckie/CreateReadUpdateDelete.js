var UglifyJS = require('uglify-js'),
    util = require('util'),
    fs = require('fs'),
    CRUD = require('./CRUDMock').CRUD,
    entityFinder = require('./entityfinder'),
    entityModifier = require('./existingentitymodifier').entityModifier;


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
    console.log(util.inspect(entity));
    entityFinder.findEntities();
    var indexes = [],
        relations = {};

    Object.keys(entity.relations).map(function(targetEntity) {
        var type = entity.relations[targetEntity].split("\n")[0];
        switch (type) {
            case '1:1':
                relations[targetEntity] = 'CRUD.RELATION_SINGLE';
                entity.properties[CRUD.entities[targetEntity].primary] = {
                    type: 'INTEGER',
                    length: 11,
                    index: true
                };
                break;
            case '1:many':
                relations[targetEntity] = 'CRUD.RELATION_FOREIGN';
                entity.properties[CRUD.entities[targetEntity].primary] = {
                    type: 'INTEGER',
                    length: 11,
                    index: true
                };
                break;
            case 'many:1':
                relations[targetEntity] = 'CRUD.RELATION_FOREIGN';
                entityModifier.readEntityProperty(targetEntity, 'relations').then(function(existingRelations) {
                    console.log(existingRelations);
                    if (!existingRelations) {
                        existingRelations = {};
                    }
                    existingRelations[entity.name] = 'CRUD.RELATION_FOREIGN';
                    entityModifier.modifyEntityProperty(targetEntity, 'relations', util.inspect(existingRelations).replace(/'CRUD.RELATION_([A-Z]+)'/g, 'CRUD.RELATION_$1'));
                });
                break;
            case 'many:many':
                relations[targetEntity] = 'CRUD.RELATION_MANY';
                break;
        }
    });
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
        migrations: {},
        relations: relations
    };
    var code = ["function " + entity.name + "() { CRUD.Entity.call(this);} ", "",
        "CRUD.define(" + entity.name + ", " + util.inspect(properties) + ",{});"
    ].join("\n");


    code = code.replace(/\'CRUD\.RELATION_(.*)\'/g, 'CRUD.RELATION_$1');

    var ast = UglifyJS.parse(code);
    var stream = UglifyJS.OutputStream({
        beautify: true
    });
    ast.print(stream);
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('./generated/' + entity.name + '.js', stream.toString());
    console.log(stream.toString()); //console.log(stream.toString());
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