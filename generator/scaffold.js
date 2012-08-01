var Scaffold = new Class({

	initialize: function() {
		$('gen').addEvent('click', function() {
			this.parseSchema($('db').get('value'), this.showSchema.bind(this));
		}.bind(this));
	},

	showSchema: function(tables) {
		console.log("Parsed schema into object", tables);
		
	},

	parseSchema : function(databaseName, callback) {
			var db = new Database(databaseName);
			db.execute(
				'select name, tbl_name, sql from sqlite_master where type="table"', { // fetch list of tables
					onComplete: function(rs) {
						var output;
						var tables = [];
						while(output = rs.next()) {
							// thx internetz
							var columnParts = /(CREATE)\x20(?:TEMP(?:ORARY)?\x20)?(TABLE)\x20(?:(?:IF|NOT|EXISTS)\x20+)*([\S\n]+)\x20(\([^;]+\))/m.exec(output.row.sql+";");

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
	}

});

