var UglifyJS = require('uglify-js'),
    util = require('util'),
    fs = require('fs'),
    CRUD = require('./CRUDMock').CRUD,
    pluralize = require('pluralize'),
    entityFinder = require('./entityfinder'),
    entityModifier = require('./existingentitymodifier').entityModifier;


function buildCreateStatement(entity) {
    var query = [entity.primary + ' INTEGER PRIMARY KEY NOT NULL'];
    Object.keys(entity.properties).map(function(property) {
        var prop = entity.properties[property];
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




function outputEntity(entity, donttouchrelated) {
    donttouchrelated = donttouchrelated || false;
    entityFinder.findEntities();
    var indexes = [],
        relations = {},
        int11 = {
            type: 'INTEGER',
            length: 11,
            index: true
        };

    function buildEntityRelations(targetEntity) {
        switch (type) {
            case '1:1':
                relations[targetEntity] = 'CRUD.RELATION_SINGLE';
                entity.properties[CRUD.entities[targetEntity].primary] = int11;
                break;
            case '1:many':
                relations[targetEntity] = 'CRUD.RELATION_FOREIGN';
                entity.properties[CRUD.entities[targetEntity].primary] = int11;
                break;
            case 'many:1':
                relations[targetEntity] = 'CRUD.RELATION_FOREIGN';
                break;
            case 'many:many':
                relations[targetEntity] = 'CRUD.RELATION_MANY';
                break;
        }
    }

    /**
     * - find foreign entities to modify
     * - inject foreign keys where needed
     * - output changes to foreign entity
     */
    function injectForeignFields(targetEntity) {
        switch (type) {
            case '1:1':
                return entityModifier.readEntityProperty(targetEntity, 'fields').then(function(fields) {
                    fields.push(entity.primary);
                    entityModifier.modifyEntityProperty(targetEntity, 'fields', JSON.stringify(fields));
                    return targetEntity;
                });
            case '1:many':
                break;
            case 'many:1':
                return entityModifier.readEntityProperty(targetEntity, 'fields').then(function(fields) {
                    fields.push(entity.primary);
                    entityModifier.modifyEntityProperty(targetEntity, 'fields', JSON.stringify(fields));
                    return targetEntity;
                });
            case 'many:many':
                break;
        }
    }

    function injectForeignRelations(targetEntity, type) {

        switch (type) {
            case '1:1':
                return entityModifier.readEntityProperty(targetEntity, 'relations').then(function(existingRelations) {
                    if (!existingRelations) {
                        existingRelations = {};
                    }
                    existingRelations[entity.name] = 'CRUD.RELATION_SINGLE';
                    entityModifier.modifyEntityProperty(targetEntity, 'relations', util.inspect(existingRelations).replace(/'CRUD.RELATION_([A-Z]+)'/g, 'CRUD.RELATION_$1'));

                });

            case '1:many':
                if (!donttouchrelated) {
                    return entityModifier.readEntityProperty(targetEntity, 'relations').then(function(existingRelations) {
                        if (!existingRelations) {
                            existingRelations = {};
                        }
                        existingRelations[entity.name] = 'CRUD.RELATION_FOREIGN';
                        entityModifier.modifyEntityProperty(targetEntity, 'relations', util.inspect(existingRelations).replace(/'CRUD.RELATION_([A-Z]+)'/g, 'CRUD.RELATION_$1'));
                    });
                }
                break;

            case 'many:1':
                relations[targetEntity] = 'CRUD.RELATION_FOREIGN';
                return entityModifier.readEntityProperty(targetEntity, 'relations').then(function(existingRelations) {
                    if (!existingRelations) {
                        existingRelations = {};
                    }
                    existingRelations[entity.name] = 'CRUD.RELATION_FOREIGN';
                    entityModifier.modifyEntityProperty(targetEntity, 'relations', util.inspect(existingRelations).replace(/'CRUD.RELATION_([A-Z]+)'/g, 'CRUD.RELATION_$1'));
                });
            case 'many:many':
                return entityModifier.readEntityProperty(targetEntity, 'relations').then(function(existingRelations) {
                    if (!existingRelations) {
                        existingRelations = {};
                    }
                    existingRelations[entity.name] = 'CRUD.RELATION_MANY';
                    entityModifier.modifyEntityProperty(targetEntity, 'relations', util.inspect(existingRelations).replace(/'CRUD.RELATION_([A-Z]+)'/g, 'CRUD.RELATION_$1'));
                });
        }
        return targetEntity;
    }

    function createConnectorEntity(targetEntity, type) {
        switch (type) {
            case 'many:many':

                var rels = {},
                    properties = {};
                relation = CRUD.entities[targetEntity];

                rels[entity.name] = 'many:1\n';
                rels[targetEntity] = '1:many\n';

                var primaryA = relation.primary;
                var primaryB = entity.primary;
                properties[primaryA] = properties[primaryB] = int11;
                var connector = {
                    table: pluralize.plural(entity.name) + '_' + pluralize.plural(targetEntity),
                    name: entity.name + '_' + targetEntity,
                    primary: 'ID_' + entity.name + '_' + targetEntity,
                    relations: rels,
                    properties: properties
                };
                return outputEntity(connector, true);
        }
        return targetEntity;
    }

    return Promise.all(Object.keys(entity.relations).map(function(targetEntity) {
        var type = entity.relations[targetEntity].split("\n")[0];
        buildEntityRelations(targetEntity);
        return injectForeignFields
            .then(injectForeignRelations)
            .then(createConnectorEntity);

    })).then(function() {

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


        return writeNewEntityToFile(entity, properties);
    });
}

function writeNewEntityToFile(entity, properties) {

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