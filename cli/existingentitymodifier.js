var UglifyJS = require("uglify-js"),
    entityFinder = require('./entityfinder'),
    fs = require('fs'),
    util = require('util');


function EntityModifier() {
    /**
     * Parse a CRUD entity with UglifyJS and find the value of the property passed
     * @param  {string} code        javascript code to parse
     * @param  {string} entityName  CRUD Entity to modify
     * @param  {string} property    property to modify
     * @return {UglifyJS.AST_Node}  Uglifyjs node for the property value
     */
    function parse_crud_entity_property(code, entityName, property) {
        var output = null;
        var ast = UglifyJS.parse(code);

        ast.walk(new UglifyJS.TreeWalker(function(node) {
            // search for CRUD.define calls
            if (node instanceof UglifyJS.AST_Call && node.start.value == 'CRUD' && node.expression.property == 'define' && node.args[0].start.value == entityName) {
                // iterate the properties passed to the CRUD.define (second arguments) and store the ast node if found for later returning
                node.args[1].properties.map(function(node) {
                    if (node.key == property) {
                        output = node;
                    }
                });
            }
        }));
        return output;
    }

    /**
     * Modify code string with a new value based on start and end position of an UglifyJS.AST_Node
     * @param  {string} code                code to modify
     * @param  {UglifyJS.AST_Node} node     node to replace the content for
     * @param  {string} replacement_string  replacement js encoded value for the property
     * @return {string}                     modified code
     */
    function rewrite_code(code, node, replacement_string) {
        return code.substr(0, node.start.pos) + replacement_string + code.substr(node.end.endpos);
    }

    /**
     * Find the filename that contains a specific entity
     * and replace the value of a specific CRUD.define property with newValue
     * @param  {string} entity   CRUD Entity name to modify
     * @param  {string} property property to alter
     * @param  {string} newValue value to rewrite original property to
     * @return {Promise}    Promise that returns modified code, already written back to file
     */
    this.modifyEntityProperty = function(entity, property, newValue) {
        return entityFinder.findEntityPath(entity).then(function(path) {
            var code = fs.readFileSync(path) + '';
            var node = parse_crud_entity_property(code, entity, property);
            var newCode = rewrite_code(code, node.value, newValue);
            fs.writeFileSync(path, newCode);
            return newCode;
        });
    };

    /**
     * Read a value from an entity's CRUD.define statement
     * @param  {string} entity   Name of the entity to find
     * @param  {string} property property to fetch the value for
     * @return {Promise}    Promise that returns value of the specified property
     */
    this.readEntityProperty = function(entity, property) {
        return entityFinder.findEntityPath(entity).then(function(path) {
            var code = fs.readFileSync(path) + '';
            var prop = parse_crud_entity_property(code, entity, property);
            console.log(prop.value);
            if ('elements' in prop.value) {
                return prop.value.elements.map(function(node) {
                    return node.start.value;
                });
            }

            if ('properties' in prop.value) {
                var output = {};
                prop.value.properties.map(function(node) {
                    console.log(node.value);
                    if ('expression' in node.value) {
                        output[node.key] = node.value.expression.name + '.' + node.value.property;
                    } else {
                        output[node.key] = code.substr(node.value.start.pos, node.value.end.endpos - node.value.start.pos);
                    }
                });
                return output;
            }
        });
    };

}

module.exports.entityModifier = new EntityModifier();