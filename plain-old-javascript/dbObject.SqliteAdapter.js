dbObject.SQLiteAdapter = function(database, options) {
	
		dbObject.ConnectionAdapter.apply( this, arguments );
		this.db = new Database(database);
		this.options = options || {};
		this.lastQuery = false;
		console.info("Created dbObject.SQLiteAdapter for database:", this.db.dbName);
		return this;
};

dbObject.SQLiteAdapter.prototype = new dbObject.ConnectionAdapter();


dbObject.SQLiteAdapter.prototype.onComplete = function(ObjectToFind, resultSet, options){
	console.info("Query Executed! ", ObjectToFind, resultSet, options);
	var output = [];
	var row;
	while (row = resultSet.next()) {
		var obj = new window[ObjectToFind]().importValues(row.row);
		obj.dbSetup.adapter = this;
		output.push(obj);
	}
	options.onSuccess(output);
};

dbObject.SQLiteAdapter.prototype.onError = function(resultset, sqlerror) {
	console.warn('DB query error: ', sqlerror, this.lastQuery, resultset);
	this.error(sqlerror, resultset);
};

dbObject.SQLiteAdapter.prototype.Find = function(what, filters, sorting, justthese, options) {
	var builder = new dbObject.QueryBuilder(what, filters, sorting, justthese, options);
	var query = builder.buildQuery();
	console.log("Executing query via sqliteadapter: ", options, query);
	var opt = options;
	this.lastQuery = query;
	this.db.execute(query, {
		onComplete: function(resultSet) { 
			console.log("Query done! firing oncomplete");
			this.onComplete(what, resultSet, opt); }.bind(this),
		onError: this.onError.bind(this)
	});
};
	
dbObject.SQLiteAdapter.prototype.Save = function(what) {
	console.error("Save in dbobject.sqliteadapter!", what);

};


