/**
 * CRUD mock object that captures definitions
 * @type {Object}
 */
var CRUD = function() {
    this.entities = {};
    this.define = function(proto, definition) {
        this.entities[proto.prototype.constructor.name] = definition;
    };
};

module.exports.CRUD = new CRUD();