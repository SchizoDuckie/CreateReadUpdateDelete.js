 
var virtualObject = new Class({
	
	database: false,
	table: false,
	properties: {},
	relations: {},
	foreignRelations: {},
	multiRelations: {},
	relationproperties: [],
	generator: false,
	primaryKey: false,
	name: '',
	graphViz: '',

	initialize: function(database,table,properties)	{
		this.database = database;
		this.table = table;
		this.dbInfo = properties;
	},

	addRelation: function(table) {
		this.relations[table] = {};
	},
	
	getPrimaryKey: function() {
		Object.each(this.dbInfo.columns, function(obj, index) {
			if (obj.primary === true) {
				this.primaryKey = obj.fieldname;
			}
			else {
				this.properties[index] = obj;
			}
		}, this);
		return(this.primaryKey);
	},

	hasProperty: function(prop) {
		return prop in this.properties;
	},

	findForeignRelations: function(objects)	{
		var relatedTables = Object.keys(this.relations);
		for(var i=0; i< relatedTables.length; i++) {
			var tbl = relatedTables[i];
			this.relations[tbl] = (objects[tbl].hasProperty(this.primaryKey)) ? '1:1' : 'foreign';
			objects[tbl].relations[this.table] = (this.hasProperty(objects[tbl].primaryKey)) ? '1:1' : 'foreign';
		}
	},

	findMultiRelations: function(objects){
		var singles = this.getForeignRelations();
		var singleNames = Object.keys(singles);
		if (Object.getLength(singles) >= 0) {
			var foreigns = [];
			for(var i=0; i<singleNames.length; i++) {
				if(objects[singleNames[i]].relations && objects[singleNames[i]].relations[this.table]) {
					foreigns.push(singleNames[i]);
				}
			}
			if (foreigns.length == 2) {
				objects[foreigns[0]].multiRelations[foreigns[1]] = this.table;
				objects[foreigns[1]].multiRelations[foreigns[0]] = this.table;
			}
		}
	},

	getSingleRelations: function() {
		return Object.filter(this.relations, function(type, key) { // find all the 1:1 relationships to this object
			return type == "1:1";
		});
	},

	getForeignRelations: function() {
		return Object.filter(this.relations, function(type, key) { // find all the 1:1 relationships to this object
			return type == "foreign";
		});
	},


	cleanup: function(objects) {
		this.relations = Object.filter(this.relations, function(type, key) {
			return !Object.keyOf(this.multiRelations, key);
		}.bind(this));
	},
	
	display: function() {
			var output = ["<h2>Relations</h2>",
			"<div><table class='editor'>",
			"<h3>All relations for this table</h3><table>"];
			if (!empty(this.relations))	{
				output.push( "<tr><th colspan='4'>Relations:</th></tr>");

				for (var table in  this.relations  ) {
					var type = this[table];
					output.push("<tr><td colspan='4'><a class='relation' href='#' onclick='chooseTable(\"{this.database}\", \"{table}\"); return false'>{table} <span class='small'>[{type}]</span></a> </td></tr>");
				}
			}
			
			if (!empty(this.multiRelations)) {
				output.push("<tr><th colspan='4'>Many To Many Relations:</th></tr><tr><th>To:</th><th colspan='3'>Via:</th></tr>");
				for (var tbl in  this.multiRelations) {
					var connectorTable = this[tbl];
					this.connectorTables.push(connectorTable);
					output.push("<tr><td><a class='relation' href='#' onclick='chooseTable(\"{this.database}\", \"{tbl}\"); return false;'>{tbl}</a></td><td colspan='3'><a class='relation via' href='#' onclick='chooseTable(\"{this.database}\", \"{connectorTable}\"); return false'>{connectorTable}</a></td></tr>");
				}
			}
					
		$(document.body).adopt(output.push('</table>').join(''));
	},

	displayGraphViz: function() {
		var currentscheme = arguments.length >= 1 ? arguments[0] : 1;
		colorschemes = {
			0 : ['#efedf5','#dadaeb','#bcbddc'],
			1 : ['#f6e8c3', '#dfc27d','#bf812d'],
			2 : ['#fff7bc','#fee391','#fec44f']
			};

		items.push(this.primaryKey);
		for (var key in  this.properties) {
			var val = this[key];
			items.push(key);
		}
		for (var property in items) {
			color = (color== colorschemes[currentscheme][0]) ?colorschemes[currentscheme][1] : colorschemes[currentscheme][0];
			out += "<tr><td bgcolor='{color}' align='left'>{property}</td></tr>";
		}
		output = "<table cellpadding='0' cellspacing='0'><tr><td bgcolor='{colorschemes[currentscheme][2]}'><font point-size='11'>{this.table}</font></td></tr>{out}</table>";
		this.graphViz = "{this.table} [fontsize=9, fontname=helvetica, label=<{output}>];\r\n";
		return(this.graphViz);

	},


	getName: function() {
		console.log("getName for virtualobject ", this.table);
		if (this.name === '') {
			if (this.primaryKey.indexOf('_') > -1) {
				var nam = this.primaryKey.split('_');
				if (nam.length >= 2) {
					var parts = [];
					for(i=0; i<nam.length; i++) {
						if (nam[i].toLowerCase() != 'id') {
							parts.push(nam[i]);
						}
					}
					this.name = parts.join('');
				}
			}
			else {
				this.name = this.table;
			}
		}
		return (String.capitalize(this.name));
	},

	createClass: function() {
		
		console.log("Creating class: ", this.getName());
		var multi = Object.keys(this.multiRelations);
		var rels = [], multis= [], relString = '';
		console.log("Multirelations: ", multi);
		for(var i=0; i<multi.length; i++) {
			console.log("getting names for multis ",  this.multiRelations[multi[i]]);
			multis.push('"' + window.Scaffold.analyzer.getName(multi[i])+'" : "'+window.Scaffold.analyzer.getName(this.multiRelations[multi[i]])+'"');
			rels.push('"' + window.Scaffold.analyzer.getName(multi[i])+'" : CRUD.RELATION_MANY');
		}
		
		var rel = Object.keys(this.relations);
		for(var i=0; i<rel.length; i++) {
			console.log("Get name for ", rel[i]);
			rels.push('"' + window.Scaffold.analyzer.getName(rel[i])+ '" : '+ (this.relations[rel[i]] == '1:1' ? 'dbObject.RELATION_SINGLE': 'CRUD.RELATION_FOREIGN'));
		}
		var props = Object.keys(this.properties);
		props.unshift(this.primaryKey);

		var output = [
		'var '+this.getName()+' = CRUD.define({',
		'	className: "'+this.getName()+'",',
		'	table: "'+this.table+'",',
		'	primary: "'+this.primaryKey+'",',
		'	fields: ["'+props.join('","')+'"],',
		'	relations: { ',
			'\t\t'+rels.join(",\n\t\t"),
		'	}, ',
		'	connectors: {',
			'\t\t'+multis.join(",\n\t\t"),
		' 	},',
		" 	createStatement: '"+this.dbInfo.sql.replace(/(--.*)\n/g,'').replace(/\'/g, '"').split("\n").join(" ")+"',",
		'	adapter: "dbAdapter"',
		'});'
		].join("\n");
 	return output;
	} 


});