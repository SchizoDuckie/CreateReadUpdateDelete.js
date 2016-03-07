var findEntities = require('./cli/entityfinder').entityFinder,
    questions = require('./cli/questions'),
    pluralize = require('pluralize'),
    entity = require('./cli/entity').entity,
    entitybuilder = require('./cli/entitybuilder'),
    Promise = require('bluebird'),
    ucFirst = require('./cli/ucfirst').ucFirst;

Promise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});


console.log([
    "------------------------------------------------",
    "   Generate a CreateReadUpdateDelete.js Entity",
    "------------------------------------------------"
].join("\n"));

questions.askEntityName().then(
    function(answers) {
        entity.name = ucFirst(answers.entityName);
        entity.table = pluralize.plural(entity.name).toLowerCase();
        entity.primary = 'ID_' + entity.name;
        console.log("Creating new CRUD Entity: %s\nTable: %s\nPrimary key: %s", entity.name, entity.table, entity.primary);
        return questions.addProperty()
            .then(questions.addRelations)
            .then(entitybuilder.outputEntity)
            .then(entitybuilder.outputConnectors)
            .then(entitybuilder.injectForeignProperties)
            .then(entitybuilder.injectForeignRelations)
            .then(entitybuilder.generateForeignMigrations);
    });