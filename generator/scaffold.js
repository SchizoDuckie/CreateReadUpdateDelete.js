var Scaffold = function() {

	generate = function(databaseName) {
			var db = new Database(databaseName);
			db.execute(
				'select name, tbl_name, sql from sqlite_master where type="table"', {
				onComplete: function(rs) {
					var output;
					while(output = rs.next()) {
						console.log(output.row.sql);
						var columnParts = /(CREATE)\x20(?:TEMP(?:ORARY)?\x20)?(TABLE)\x20(?:(?:IF|NOT|EXISTS)\x20+)*([\S\n]+)\x20(\([^;]+\))/m.exec(output.row.sql+";");
						//console.log(columnParts);
						
						if(columnParts) {
							var fields = columnParts[columnParts.length -1], out=[];
							
							fields = fields.substr(1, fields.length -2).split(',');
							
							for(i=0; i<fields.length; i++) {
								//console.log(fields);
								if(fields[i].indexOf('--') === -1) {
									out.push(fields[i].trim());
								} else {
									
									var field = fields[i].split("\n");
									
									for(var j=0; j< field.length; j++) {
										if(field[j].indexOf('--') === -1 && field[j].trim().length > 0) {
											out.push(field[j].trim());
										}
									}
								}
							}
							var columns = {};
							for(var i in out) {
								var f = { fieldname: '', type: 'VARCHAR', length: 0, 'primary': false, 'null': false};

								var tokens = out[i].split(' ');
								f.fieldname = tokens[0].replace(/\"/g, '');
								f.primary = out[i].indexOf('PRIMARY') > -1;
								f['null'] = out[i].indexOf('NOT NULL') > -1;
								f.type = tokens[1];
								columns[f.fieldname] = f;
							}
							console.log(output.row.name, columns);
							
						}
					}
				}
			});
	};


	return this;
}();

