CRUD.SQLiteAdapter = function(database, options) {
	console.log("Create new crud.sqliteadapter!");
		CRUD.ConnectionAdapter.apply( this, arguments );
		this.db = new Database(database, options);
		this.options = options || {};
		this.lastQuery = false;
		//console.info("Created CRUD.SQLiteAdapter for database:", this.db.dbName);
		return this;
};

CRUD.SQLiteAdapter.prototype = new CRUD.ConnectionAdapter();

var prototypeMethods = {
	onComplete : function(ObjectToFind, resultSet, options) {
		//console.info("Query Executed! ", ObjectToFind, resultSet, options);
		var output = [];
		var row;
		while (row = resultSet.next()) {
			var obj = new window[ObjectToFind]().importValues(row.row);
			obj.dbSetup.adapter = this;
			output.push(obj);
		}
		options.onSuccess(output);
	},
	onError : function(resultset, sqlerror, queryInfo) {
		console.log('ERRORT!', sqlerror, resultset, queryInfo);
		if(sqlerror.message.indexOf('no such table') > -1) {
			console.log(queryInfo.what, ": Table does not exist.");
			var ojb = new window[queryInfo.what]();
			console.log(ojb);	
			if(!ojb.dbSetup.createStatement) {
				console.log("No create statement found for "+queryInfo.what+". Don't know how to create table.");
			} else {
				console.log("Create statment found. Creating table for "+queryInfo.what, this.db);
				debugger;
				this.db.execute(ojb.dbSetup.createStatement, {
					onComplete: function(resultSet) {
						console.log("Create statement completed!", ojb.dbSetup.createStatement, queryInfo);
						CRUD.Find(queryInfo.what, queryInfo.filters, queryInfo.options);
					 }.bind(this),
					onError: this.onError.bind(this)
				});	
				return;
			}	
		}
		console.warn('DB query error: ', sqlerror, this.lastQuery, resultset);
		this.error(sqlerror, resultset);
	},
	Find : function(what, filters, sorting, justthese, options, filters) {
		var builder = new CRUD.QueryBuilder(what, filters, sorting, justthese, options);
		var query = builder.buildQuery();
		console.log("Executing query via sqliteadapter: ", options, query);
		var opt = options;
		this.lastQuery = query;
		var errd = this.onError.bind(this);
		var completeFunc = this.onComplete.bind(this);
		
		var errorFunc = function(resultSet, sqlError) {
				errd(resultSet, sqlError, {
					what: what,
					options:opt,
					filters: filters
				});
			};
		this.db.execute(query, {
			onComplete: function(resultSet) {
				completeFunc(what, resultSet, opt);
			},
			onError:errorFunc
		});
	},
	Save : function(what, callbacks) {
		var query = [], valCount =0, values = [], valmap = [], names =[];
		var errfunc = function(rs, e) {
			console.error("Error saving CRUD Entity to database", what.getType(), what, e, rs);
			callbacks.onError(e);
		};
		changes = {} ;
		changes = Objectmerge(changes, what.changedValues);

		for(var i in changes) {
			if(changes.hasOwnProperty(i)) {
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
			this.db.execute(query.join(' '), {
				values: valmap,
				onComplete: function(resultSet) {
					resultSet.Action = 'inserted';
					resultSet.Result = Objectmerge(what.databaseValues, what.changedValues);
					resultSet.Result[what.dbSetup.primary] = resultSet.rs.insertId;
					callbacks.onComplete(resultSet);
				},
				onError:  errfunc
			});
		} else {  // existing : build an update query.
			query.push('update',what.dbSetup.table,'set');
			for(i=0; i< names.length; i++) {
				query.push(names[i]+ ' = ?');
				if(i < names.length -1) query.push(',');
			}
			valmap.push(what.getID());
			query.push('where',what.dbSetup.primary, '= ?');
			this.db.execute(query.join(' '), {
				values: valmap,
				onComplete: function(resultSet) {
					resultSet.Action = 'updated';
					resultSet.Result = Objectmerge(what.databaseValues, what.changedValues);
					callbacks.onComplete(resultSet);
				},
				onError:  errfunc
			});
		}
	},
	Delete : function(what, events) {
		var query = [], values = [], valmap = [], names=[];
		if(what.dbSetup.ID !== false) {
			// insert
			query.push('delete from',what.dbSetup.table,'where',what.dbSetup.primary,'= ?');
			this.db.execute(query.join(' '), {
				values: [what.getID()],
				onComplete: function(resultSet) {
					resultSet.Action = 'deleted';
					events.onComplete(resultSet);
				}
			});
		} else {
			// Nothing to delete
		}
	}
};


for(var i in prototypeMethods) {
	CRUD.SQLiteAdapter.prototype[i] = prototypeMethods[i];
}