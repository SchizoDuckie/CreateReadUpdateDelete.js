var UglifyJS = require("uglify-js"),
    fs = require('fs');

function parse_crud_entity_property(code, entityName, property) {
    var output = null;
    var ast = UglifyJS.parse(code);
    //ast.figure_out_scope();
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

function rewrite_code(code, node, replacement_string) {
    return code.substr(0, node.start.pos) + replacement_string + code.substr(node.end.endpos);
}

/*
// test parse a CRUD.entities.js file where multiple entities are defined
var code = fs.readFileSync('../DuckieTV/js/CRUD.entities.js') + '';
var property = parse_crud_entity_property(code, 'Serie', 'fields');
//console.log(property);
var old_values = property.value.elements.map(function(node) {
    return node.start.value;
});

console.log("Old values for 'fields' : ", JSON.stringify(old_values));
old_values.push("ID_something");
code = rewrite_code(code, property.value, JSON.stringify(old_values));
console.log("Patched code: ", code);
*/

var code = fs.readFileSync('./demo/Serie.js') + '';
var property = parse_crud_entity_property(code, 'Serie', 'fields');
//console.log(property);
var old_values = property.value.elements.map(function(node) {
    return node.start.value;
});

console.log("Old values for 'fields' : ", JSON.stringify(old_values));
old_values.push("ID_something");
code = rewrite_code(code, property.value, JSON.stringify(old_values));
console.log("Patched code: ", code);