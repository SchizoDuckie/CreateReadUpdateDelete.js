CRUD.SQLiteAdapter = function(database, dbOptions) {
	this.databaseName = database;
	this.dbOptions = dbOptions
	this.lastQuery = false;

	CRUD.ConnectionAdapter.apply( this, arguments );
	
	this.Init = function() {
		var that = this;
		return new Promise(function(resolve, fail) {
			that.db = new Database(that.databaseName, that.dbOptions);
			that.db.connect().then(function() {
				CRUD.log("SQLITE connection created to ", that.databaseName);
				that.verifyTables().then(resolve, fail);
			}, fail);
		});
	};

	this.verifyTables = function() {
		CRUD.log('verifying that tables exist');
		var that = this;
		var PromiseQueue = [];
	
		for(var i in CRUD.EntityManager.entities) {

			PromiseQueue.push(new Promise(function(resolve, fail) {
				var entity = CRUD.EntityManager.entities[i];
			
				that.db.execute("SELECT count(*) as existing FROM sqlite_master WHERE type='table' AND name= ?", [entity.table]).then(function(resultSet) {

					var res = resultSet.next().row;
					if(res.existing === 0) {
						CRUD.log(entity, ": Table does not exist.");
						if(!entity.createStatement) {
							CRUD.log("No create statement found for "+entity.className+". Don't know how to create table.");
							fail();
						} else {
							CRUD.log("Create statement found. Creating table for "+entity.className);
							that.db.execute(entity.createStatement).then(function() {
								CRUD.log(entity.className+" table created.");
								if(entity.fixtures) {
									var pq = [];
									CRUD.log(entity.fixtures.length + ' Fixtures found for '+entity.className+' inserting.')
									for(var i=0; i<entity.fixtures.length; i++) {
										pq.push(CRUD.fromCache(entity.className, entity.fixtures[i]).Persist(true, 'INSERT'));
									}
								    Promise.all(pq).then(resolve);
								}
							}, function(err) { CRUD.log("Error creating "+entity.className, err); fail(); });
						}	
					} else {
						resolve();
					}
				}, function(err) {
					CRUD.log("Failed!", err, entity);;
					fail();
				});
			}));
			
		}

		return Promise.all(PromiseQueue);
			

	
		//this.db.
/*
			CRUD.log('SQL Error!!', sqlerror, resultset, [what, query, options, this]);
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
		
		CRUD.log("Executing query via sqliteadapter: ", options, query);
		return new Promise(function(resolve, fail) {
			that.db.execute(query.query, query.parameters).then(function(resultset) {
				var row, output = [];
				while (row = resultset.next()) {
					var obj = new window[what]().importValues(row.row);
					output.push(obj);
				}
				resolve(output);
			}, function(resultSet, sqlError) {
				CRUD.log('SQL Error in FIND : ',sqlError, resultSet, what, this, query);
				debugger;
				fail();
			});
		});
	},
	this.Persist = function(what, forceInsert) {
		var query = [], valCount =0, values = [], valmap = [], names =[], that=this;
		
		for(var i in what.changedValues) {
			if( what.changedValues.hasOwnProperty(i)) {
				names.push(i);
				values.push('?');
				valmap.push(what.changedValues[i]);
			}
		}
		var defaults = CRUD.EntityManager.entities[what.className].defaults || {};
		for(var i in defaults) {
			names.push(i);
			values.push('?');
			valmap.push(defaults[i]);
		}

		if(what.getID() === false || undefined ==  what.getID() || forceInsert) { // new object : insert.
			// insert
			query.push('INSERT INTO ',CRUD.EntityManager.entities[what.className].table,'(', names.join(","),') VALUES (', values.join(","), ');');
			
			CRUD.log(query.join(' '), valmap);
			return new Promise(function(resolve, fail) { 
				that.db.execute(query.join(' '), valmap).then(function(resultSet) {
					resultSet.Action = 'inserted';
					resolve(resultSet);
				}, function(err, tx) {
					fail(err, tx);
				});
			});
		} else {  // existing : build an update query.
			query.push('UPDATE',CRUD.EntityManager.entities[what.className].table,'SET');
			for(i=0; i< names.length; i++) {
				query.push(names[i]+ ' = ?');
				if(i < names.length -1) query.push(',');
			}
			valmap.push(what.getID());
			query.push('WHERE',CRUD.EntityManager.getPrimary(what.className), '= ?');

			return new Promise(function(resolve, fail) {
				that.db.execute(query.join(' '), valmap).then(function(resultSet) {
					resultSet.Action = 'updated';
					resolve(resultSet);
				}, fail);
			});
		}
	}
	this.Delete = function(what, events) {
		var query = [], values = [], valmap = [], names=[], that=this;
		if(what.getID() !== false) {
			// insert
			query.push('delete from',CRUD.EntityManager.entities[what.clasName].table,'where',CRUD.EntityManager.getPrimary(what.className),'= ?');
			return new Promise(function(resolve, fail) {
				this.db.execute(query.join(' '), [what.getID()]).then(function(resultSet) {
					resultSet.Action = 'deleted';
					resolve(resultSet);
				}, function(e) {
					CRUD.log("error deleting element from db: ", e);
					fail(e);
				})
			});
		} else {
			return false;
		}
	}

	return this;
};