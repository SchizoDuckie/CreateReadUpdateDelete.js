CRUD.SQLiteAdapter = function(database, options) {
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
	onError : function(resultset, sqlerror) {
		console.warn('DB query error: ', sqlerror, this.lastQuery, resultset);
		this.error(sqlerror, resultset);
	},
	Find : function(what, filters, sorting, justthese, options) {
		var builder = new CRUD.QueryBuilder(what, filters, sorting, justthese, options);
		var query = builder.buildQuery();
		console.log("Executing query via sqliteadapter: ", options, query);
		var opt = options;
		this.lastQuery = query;
		this.db.execute(query, {
			onComplete: function(resultSet) {
				this.onComplete(what, resultSet, opt); }.bind(this),
			onError: this.onError.bind(this)
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