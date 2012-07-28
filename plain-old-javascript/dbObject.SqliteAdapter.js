dbObject.SQLiteAdapter = function(database, options) {
	
		this.db = new Database(database);
		console.info("Created dbObject.SQLiteAdapter for database:", this.db.dbName);
		dbObject.ConnectionAdapter.apply( this, arguments );

		return this;
};

dbObject.SQLiteAdapter.prototype = new dbObject.ConnectionAdapter();


dbObject.SQLiteAdapter.prototype.onComplete = function(ObjectToFind, resultSet, options){
	console.info("Query Executed! ", ObjectToFind, resultSet);
	var output = [];
	var row;
	while (row == resultSet.next()) {
		var obj = new window[ObjectToFind]().importValues(row.row);
		obj.dbSetup.adapter = this;
		output.push(obj);
	}
	$(document.body).removeClass('wait');
	options.onSuccess(output);
};

dbObject.SQLiteAdapter.prototype.onError = function(resultset, sqlerror) {
	console.warn('DB query error: ', sqlerror, resultset);
	this.error(sqlerror, resultset);
};

dbObject.SQLiteAdapter.prototype.Find = function(what, filters, sorting, justthese, options) {
	builder = new dbObject.QueryBuilder(what, filters, sorting, justthese, options);
	var query = builder.buildQuery();
	console.log("Executing query: ", options, query);
	
	this.db.execute(query, {
		onComplete: function(resultSet) { console.log("Query done! firing oncomplete");
		this.onComplete(what, resultSet, options); }.bind(this),
		onError: this.onError.bind(this)
	});
};
	
dbObject.SQLiteAdapter.prototype.Save = function(what) {
	console.error("Save in dbobject.sqliteadapter!", what);

};


