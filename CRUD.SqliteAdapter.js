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
		var PromiseQueue = [];
	
		for(var i in CRUD.EntityManager.entities) {

			PromiseQueue.push(new Promise(function(resolve, fail) {
				var entity = CRUD.EntityManager.entities[i];
			
				console.log("Myent!", entity);
				that.db.execute("SELECT count(*) as existing FROM sqlite_master WHERE type='table' AND name= ?", [entity.table]).then(function(resultSet) {

					var res = resultSet.next().row;
					if(res.existing === 0) {
						console.log(entity, ": Table does not exist.");
						if(!entity.createStatement) {
							console.log("No create statement found for "+entity.className+". Don't know how to create table.");
						} else {
							console.log("Create statement found. Creating table for "+entity.className);
							that.db.execute(entity.createStatement).then(function() {
								console.log(entity.className+" table created.");
								if(entity.fixtures) {
									for(var i=0; i<entity.fixtures.length; i++) {
										CRUD.fromCache(entity.className, entity.fixtures[i]).Persist(true);
									}
								}
							}, function(err) { console.error("Error creating "+entity.className, err); })
						}	
					}
					resolve();
				}, function(err) {
					console.error("Failed!", err, entity);;
					fail();
				});
			}));
			
		}

		return Promise.all(PromiseQueue);
			

	
		//this.db.
/*
			console.log('SQL Error!!', sqlerror, resultset, [what, query, options, this]);
			// @TODO: Move this to db adapter?
			if(sqlError.message.indexOf('no su3h table') > -1) {
				
			}*/

	};
	
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