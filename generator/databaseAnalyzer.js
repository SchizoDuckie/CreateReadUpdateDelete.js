DatabaseAnalyzer = new Class({
	Implements: [Options, Events],
	db:  false,
	tables : [],
	field: [],
	primaryKeys: [],
	fieldList: [],
	relations: [],
	tableList: [],
	virtuals: {},

	initialize: function(db, options) {
		this.options = options || {};
		this.db = db;
		this.parseSchema(db, this.Analyze.bind(this));
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

	getName: function(table) {
		var virtual = this.virtuals[table];
		console.log("getName! ", table, virtual);
		if (virtual.name === '') {
			if (virtual.primaryKey.indexOf('_') > -1) {
				var nam = virtual.primaryKey.split('_');
				if (nam.length >= 2) {
					var parts = [];
					for(i=0; i<nam.length; i++) {
						if (nam[i].toLowerCase() != 'id') {
							parts.push(nam[i]);
						}
					}
					virtual.name = parts.join('');
				}
			}
			else {
				virtual.name = virtual.table;
			}
		}
		return (String.capitalize(virtual.name));
	},

	Analyze: function(tables, completed) {
		console.log("Analyzing tables: ", tables);
		for(var i=0; i<tables.length; i++) {
				this.tables.push(tables[i]);
				var currentTable = tables[i];
				var virtualTable = new virtualObject(this.db, currentTable.name, currentTable);		// convert it to virtualObject
				var pk = virtualTable.getPrimaryKey();
				if(!pk) continue;
				if(!this.primaryKeys[pk]) {
					this.primaryKeys[pk] = [];
				}
				this.primaryKeys[pk].push(currentTable);						// find primary keys, and store ze op in a global array with this object attached to it
				this.virtuals[currentTable.name] = virtualTable;				// store this virtualObject too.
		}
		var keys = Object.keys(this.primaryKeys);
		for(var i=0; i<keys.length; i++) {
				var field = keys[i];
				var tables = this.primaryKeys[field];
				for(var k=0; k<tables.length; k++) {
					var curt = tables[k].name;
					for(j=0; j< this.tables.length; j++) {
						var table = this.tables[j].name;
						if (this.virtuals[table] && this.virtuals[table].hasProperty(field)) {
							this.virtuals[table].addRelation(curt);			// if that's true, it's a relation to $tables[0]
							this.virtuals[curt].addRelation(table);
						}
					}
				}
			}

			Object.each(this.virtuals, function(tbl) {				// run it again and find all foreign relations
				tbl.findForeignRelations(this.virtuals);
			}, this);

			Object.each(this.virtuals, function(tbl, id) {				// run it again and find all foreign relations
				tbl.findMultiRelations(this.virtuals);
			}, this);

			Object.each(this.virtuals, function(tbl, id) {				// run it again and find all foreign relations
				tbl.cleanup(this.virtuals);								// throw away the unnessecary stuff.
			}, this);
		
		console.log("Done analyzign! ", this);
		if(this.options.onAnalyzed) {
			this.options.onAnalyzed(this.virtuals, this);
		}
	},

	displayGraphViz: function() {
		var table = arguments.length >= 1 ? arguments[0] : false;

		this.Analyze();
		output  = [
		'graph ER {',
			'rankdir=UD;',
			'fontname=arial;',
			'bgcolor=transparent;',
			'fontcolor=000000;',
			'concentrate=true;',
			 'node [shape=plaintext];'
		].join('\n');
		
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
					if(this.virtuals[targettbl]){
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
			for (var connectedTable in connectedTables  ) {
				if(rellines[connectedTable][currentTable] !== false) {
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