 
var virtualObject = new Class({
	
	initialize: function(database,table,properties)	{
		this.database = database;
		this.table = table;
		this.dbInfo = properties;
		this.relations = {};
		this.foreignRelations = {};
		this.multiRelations = {};
		this.properties = {};
		this.relationproperties = [];
		this.generator = false;
		this.graphViz ='';
	},

	addRelation: function(table) {
		this.relations[table] = {};
	},
	
	getPrimaryKey: function() {
		Object.each(this.dbInfo, function(obj, index) {
			if (obj.primary === true) {
				this.primaryKey = obj.fieldname;
			}
			else {
				this.properties[index] = obj;
			}
		});
		this.setupMappings();
		return(this.primaryKey);
	},

	hasProperty: function(prop) {
		return prop in this.properties;
	},

	findForeignRelations: function(objects)	{
		Object.each(this.relations, function(obj, index) {
			if (objects[table].relations[this.table]) {						// foreign relations hebben een link naar $this, maar property $targettable->{$this->primarykey}
				this.relations[table] = '1:1';								// $table->$field  zit 1:1 naar $this->ID, is dus 1:1 link
				objects[table].relations[this.table] = 'foreign';			// we laten de target tabel ook weten dat ie een relatie met deze tabel heeft.
			}
		});
	},

	findMultiRelations: function(objects){
		for (var table in  this.relations) {
			var type = this.relations[table];
			if (type == 'foreign' && objects[table].relations[this.table]) {	// doorloop alle foreign relations van deze tabel // en kijk of er een link terug voorkomt naar deze tabel
				var tables = Object.filter(objects[table].relations, function(type, key) { // find all the 1:1 relationships to this object
					return type == "1:1";
			});
			if (Object.getLength(tables) == 2) {
				delete tables[unsetme];
				this.multiRelations[tables] = table;					// en voeg $targettable toe :)
				}
			}
		}
	},

	cleanup: function(objects) {
		//print_r($this->relations);
		for (var table in this.relations) {
			var type = this[table];
			if (type == '1:1') {											// doorloop alle foreign relations van deze tabel{
				this.relationproperties[objects[table].primaryKey] = this.ucProperties[objects[table].primaryKey];
				delete this.properties[objects[table].primaryKey];
				delete this.propertymappings[objects[table].primaryKey];
			}
		}
		for (var target in this.multiRelations) {
			var connector = this[target];
			if (array_key_exists(connector, this.relations) && this.relations[connector] == 'foreign') {	// doorloop alle foreign relations van deze tabel
				delete this.relations[connector];
								// en pleur ze weg als ze koppeltabel zijn
			}
		}
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


	createClass: function() {
		var analyzer = window.databaseAnalyzer;
		var generator = new classGenerator(this);
		generator.feedValues(this);
		this.name = analyzer.getName(this.table);
		generator.name = this.name;
		generator.table = this.table;
		generator.dbInfo = this.dbInfo;
		generator.relationproperties = this.relationproperties;
		generator.properties = this.propertymappings;
		this.primaryKey = this.getPrimaryKey();
		generator.fields = generator.createConstructor();
		generator.primaryKey = this.ucProperties[this.primaryKey];
		generator.relations = generator.createRelations();
		generator.dbSchema = generator.createSchema();

		tpl = new TemplateEngine('./templates/template.class.php');
		tpl.feedValues(generator.props);
		tpl.template = './templates/template.class.php';

		this.generator = generator;
		return(tpl.run());
	}


});