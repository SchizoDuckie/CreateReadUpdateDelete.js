/**
 * CRUD mock object that captures definitions
 * @type {Object}
 */
var CRUD = function() {
    this.RELATION_SINGLE = 1;
    this.RELATION_FOREIGN = 2;
    this.RELATION_MANY = 3;
    this.RELATION_CUSTOM = 4;
    this.entities = {};
    this.define = function(proto, definition) {
        this.entities[proto.prototype.constructor.name] = definition;
    };
};

module.exports.CRUD = new CRUD();