CRUD.SQLiteAdapter = function(database, dbOptions) {
	this.databaseName = database;
	this.dbOptions = dbOptions
	this.lastQuery = false;

	CRUD.ConnectionAdapter.apply( this, arguments );
	
	this.Init = function() {
		console.log("Create new crud.sqliteadapter!");
		var that = this;
		return new Promise(function(resolve, fail) {
			that.db = new Database(that.databaseName, that.dbOptions);
			that.db.connect().then(function() {
				that.verifyTables().then(resolve, fail);
			}, fail);
		});
	};

	this.verifyTables = function() {
		console.log('verifying that tables exist');
		var that = this;
		for(var i in CRUD.EntityManager.entities) {
			console.log(i);
			that.db.execute("SELECT count(*), "+CRUD.EntityManager.entities[i].table+" as tblname FROM sqlite_master WHERE type='table' AND name= ?", [CRUD.EntityManager.entities[i].table, CRUD.EntityManager.entities[i].table]).then(function(resultSet) {
		
				var res = resultSet.next().row;
				console.log("Rsult: ", res, res.existing, res.name, res);;
			}, function(err) {
				console.error("Failed!", err, entity);;
			});
			
		}
		//this.db.
/*
			console.log('SQL Error!!', sqlerror, resultset, [what, query, options, this]);
			// @TODO: Move this to db adapter?
			if(sqlError.message.indexOf('no such table') > -1) {
				console.log(what, ": Table does not exist.");
				var ojb = new window[queryInfo.what]();
				if(!ojb.dbSetup.createStatement) {
					console.log("No create statement found for "+queryInfo.what+". Don't know how to create table.");
				} else {
					console.log("Create statement found. Creating table for "+what, this.db);
					this.db.execute(ojb.dbSetup.createStatement).then(function(rs) {
							console.log("Table created successfully!!", ojb.dbSetup.createStatement, [what, quey, options, this]);
							CRUD.Find(what, filters, options).then(resolve, fail);
						 }.bind(this), fail);
					return;
				}	
			}*/

	},
	
	this.Find = function(what, filters, sorting, justthese, options, filters) {

		var builder = new CRUD.QueryBuilder(what, filters, sorting, justthese, options);
		var query = builder.buildQuery();
		var opt = options;
		this.lastQuery = query;
		var that = this;
		
		console.log("Executing query via sqliteadapter: ", options, query);
		return new Promise(function(resolve, fail) {
			that.db.execute(query).then(function(resultset) {
				var row, output = [];
				while (row = resultSet.next()) {
					var obj = new window[what]().importValues(row.row);
					obj.dbSetup.adapter = this;
					output.push(obj);
				}
				resolve(output);
			}, function(resultSet, sqlError) {
				fail('SQL Error in FIND : ',sqlerror, resultset, what, this);
			});
		});
	},
	this.Persist = function(what) {
		var query = [], valCount =0, values = [], valmap = [], names =[], that=this;
		
		for(var i in what.changedValues) {
			if( what.changedValues.hasOwnProperty(i)) {
				names.push(i);
				values.push('?');
				valmap.push(changes[i]);
				valCount++;
			}
		}

		if(what.getID() === false) { // new object : insert.
			// insert
			query.push('INSERT INTO ',what.dbSetup.table,'(', names.join(","),') VALUES (', values.join(","), ');');
			
			console.log(query.join(' '), valmap);
			return new Promise(function(resolve, fail) { 
				that.db.execute(query.join(' '), valmap).then(function(resultSet) {
					resultSet.Action = 'inserted';
					resultSet.Result = Objectmerge(what.databaseValues, what.changedValues);
					resultSet.Result[what.dbSetup.primary] = resultSet.rs.insertId;
					resolve(resultSet);
				}, function(err, tx) {
					fail(err, tx);
				});
			});
		} else {  // existing : build an update query.
			query.push('update',what.dbSetup.table,'set');
			for(i=0; i< names.length; i++) {
				query.push(names[i]+ ' = ?');
				if(i < names.length -1) query.push(',');
			}
			valmap.push(what.getID());
			query.push('where',what.dbSetup.primary, '= ?');

			return new Promise(function(resolve, fail) {
				that.db.execute(query.join(' '), valmap).then(function(resultSet) {
					resultSet.Action = 'updated';
					resultSet.Result = Objectmerge(what.databaseValues, what.changedValues);
					resolve(resultSet);
				}, fail);
			});
		}
	}
	this.Delete = function(what, events) {
		var query = [], values = [], valmap = [], names=[], that=this;
		if(what.dbSetup.ID !== false) {
			// insert
			query.push('delete from',what.dbSetup.table,'where',what.dbSetup.primary,'= ?');
			return new Promise(function(resolve, fail) {
				this.db.execute(query.join(' '), [what.getID()]).then(function(resultSet) {
					resultSet.Action = 'deleted';
					resolve(resultSet);
				}, function(e) {
					console.error("error deleting element from db: ", e);
					fail(e);
				})
			});
		} else {
			return false;
		}
	}

	return this;
};