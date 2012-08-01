
 
var databaseanalyzer = new Class({
	Implements:[Options, Events],
	db:  false,
	tables : [],
	field: [],
	primaryKeys: {},
	fieldList: [],
	relations: [],
	tableList: [],
	virtuals: {},

	initialize: function(db, options) {
		this.db = db;
		this.parseSchema(databaseName, this.Analyze.bind(this));
	},


	parseSchema : function(databaseName, callback) {
			var db = new Database(databaseName);
			db.execute(
				'select name, tbl_name, sql from sqlite_master where type="table"', { // fetch list of tables
					onComplete: function(rs) {
						var output;
						var tables = [];
						while(output = rs.next()) {
							var columnParts = /(CREATE)\x20(?:TEMP(?:ORARY)?\x20)?(TABLE)\x20(?:(?:IF|NOT|EXISTS)\x20+)*([\S\n]+)\x20(\([^;]+\))/m.exec(output.row.sql+";"); // thx internetz

							if(columnParts) {
								var fields = columnParts[columnParts.length -1];
								var out=[];
								
								fields = fields.substr(1, fields.length -2).split(/,[\x20]{0,}\"/); // parse out all the next fields, separated by ,[white]" skip the ()
								for(i=0; i<fields.length; i++) {
									if(fields[i].indexOf('--') === -1 && fields[i].indexOf("\n") == -1) { // no sql comments, single line
										out.push(fields[i].trim());
									} else {
										var field = fields[i].split("\n"); // multi line sql stmt
										for(var j=0; j< field.length; j++) {
											if(field[j].indexOf('--') === -1 && field[j].trim().length > 0) {
												out.push(field[j].trim());
											}
										}
									}
								}
								var columns = {};
								Object.each(out, function(j,i) {
									var f = { fieldname: '', type: 'VARCHAR', 'primary': false, 'null': false};
									var tokens = out[i].split(' ');
									f.fieldname = tokens[0].replace(/\"/g, '');
									f.primary = out[i].indexOf('PRIMARY') > -1;
									f['null'] = out[i].indexOf('NOT NULL') > -1;
									f.type = tokens[1];
									columns[f.fieldname] = f;
								});
								tables.push({name: output.row.name, sql: output.row.sql, columns: columns});
							}
						}
						callback(tables);
				}, onError: function(e,f) {
					console.error('Error while fetching db schema', e,f);
					callback([]);
				}
			});
	},

	Analyze: function(tables) {
		console.log("Analyzing tables: ", tables);
		for(i=0; i<tables.length; i++) {
				this.tables.push(tables[i]);
				var currentTable = tables[i];
				var virtualTable = new virtualObject(this.db, currentTable);		// convert it to virtualObject
				var pk = virtualTable.getPrimaryKey();
				if(!this.primaryKeys[pk]) {
					this.primaryKeys[pk] = [];
				}
				this.primaryKeys[pk].push(currentTable);	// find primary keys, and store ze op in a global array with this object attached to it
				this.virtuals[currentTable] = virtualTable;					// store this virtualObject too.
		}
		
		Object.each(this.primaryKeys, function(object, field) {
				var tables = this[field];
				for (var id in this.tables){ // and find all tables where this key exist 
						var table = this[id];
						if (this.virtuals[table].hasProperty(field)) {
							this.virtuals[table].addRelation(tables[0]);		// if that's true, it's a relation to $tables[0]
						}
					}
				}

				for (var table in this.virtuals) {						// run it again and find all foreign relations
					var object = this[table];
					object.findForeignRelations(this.virtuals);					
				}
				
				for (var table in this.virtuals) {						// run it again and find al many:many relations (2 foreign keys where one of them is $this)
				 	var object = this[table];
					object.findMultiRelations(this.virtuals);					
				}
				for (var table in this.virtuals) {
				 	var object = this[table];	
					object.cleanup(this.virtuals);								// throw away the unnessecary stuff.
				}

		});
			
		
	
	},

	getName: function(table) {
		if (this.virtuals[table].name == '') {
			if (strpos(this.virtuals[table].primaryKey, '_') != false) {
				var nam = this.virtuals[table].primaryKey.split('_');
				if (nam.length >= 2) {
					for (var key in nam) {
						var val = nam[key];
						if (strtolower(val) == 'id')
						{
							delete nam[key];

						}
					}
					this.virtuals[table].name = implode("", nam);
				}
			}
			else {
				this.virtuals[table].name = ucFirst(this.virtuals[table].table);
			}
		}
		
		return (ucFirst(this.virtuals[table].name));
	},
	


	displayGraphViz: function() {
		var table = arguments.length >= 1 ? arguments[0] : false;

		this.Analyze();
		output  = '
		graph ER {
			rankdir=UD;
			fontname=arial;
			bgcolor=transparent;
			fontcolor=000000;
			concentrate=true;
			 node [shape=plaintext];
		';
		
		tables = [];
		relations = [];
		rellines = [];
		
		if(table != false) {
			starttable = this.virtuals[table];			
			tables[table] = starttable.displayGraphViz(0);
			for (var srctable in starttable.relations) {
				var type = starttable[srctable];
				tables[srctable] = this.virtuals[srctable].displayGraphViz(1);
				rellines[object.table][srctable] = srctable;
			}
			for (var sourcetbl in starttable.multiRelations) {
				var targettbl = starttable[sourcetbl];
				if(array_key_exists(sourcetbl, this.virtuals)) {
					tables[sourcetbl] = this.virtuals[sourcetbl].displayGraphViz(2);
				}
				if(array_key_exists(targettbl, this.virtuals)) {
					tables[targettbl] = this.virtuals[targettbl].displayGraphViz(1);
				}
				rellines[object.table][targettbl][sourcetbl] = targettbl;
			}
		}
		else {
			for (var object in this.virtuals) {
				tables[object.table] = object.displayGraphViz();
				for (var srctable in object.relations){
					var type = object[srctable];
					tables[srctable] = this.virtuals[srctable].displayGraphViz(1);
					rellines[object.table][srctable] = srctable;
				}
				for (var sourcetbl in object.multiRelations) {
					var targettbl = object[sourcetbl];
					if(array_key_exists(sourcetbl, this.virtuals)) {
						tables[sourcetbl] = this.virtuals[sourcetbl].displayGraphViz(2);
					}
					if(array_key_exists(targettbl, this.virtuals){
						tables[targettbl] = this.virtuals[targettbl].displayGraphViz(1);
					}
					rellines[object.table][targettbl][sourcetbl] = targettbl;
				}
			}			
		}
		
		
		output += implode(';', array_keys(tables))+"\r\n";
		for (var table in tables){
			var viz = tables[table];
			output += "\r\n"+viz+"\r\n";
		}
		
		for (var currentTable in rellines) {
			var connectedTables = rellines[currentTable];
			for (var connectedTable in connectedTables  ) 
				if(array_key_exists(currentTable, rellines[connectedTable]) != false) {
				//	unset($rellines[$connectedTable][$currentTable]);
				}
			}
		}
		
		for (var table in rellines) {
			var array = rellines[table];
			if(sizeof(array) > 0) {
				keys = array_keys(array);
				output += "{keys[0]} -- {table} -- {keys[1]}\r\n";
				
			}
		}

		output += "}";
		viz = new Graphviz();
		viz.generate(output);
	}


});