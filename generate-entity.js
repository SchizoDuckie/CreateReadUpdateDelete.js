var findEntities = require('./cli/entityfinder').entityFinder,
    questions = require('./cli/questions'),
    pluralize = require('pluralize'),
    entity = require('./cli/entity').entity,
    entitybuilder = require('./cli/entitybuilder');



var ucFirst = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};


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
            .then(entitybuilder.injectForeignProperties)
            .then(entitybuilder.injectForeignRelations)
            .then(entitybuilder.generateForeignMigrations);
    });