 dbObject.SQLiteAdapter = new Class({
	Implements: [dbObject.ConnectionAdapter],
	db : false,
	initialize: function(database, options) {
		window.addEvent('domready', function() {
			this.db = new Database(database);
			console.info("Created dbObject.SQLiteAdapter for database:", this.db.dbName);
		}.bind(this));
	},
	
	onComplete: function(ObjectToFind, resultSet, options){
		console.info("Query Executed! ", ObjectToFind, resultSet);
		var output = Array();
		while (row = resultSet.next()) {
			var obj = new window[ObjectToFind]().importValues(row.row);
			obj.dbSetup.adapter = this;
			output.push(obj);
		}
		$(document.body).removeClass('wait');
		options.onSuccess(output);
	},

    onError: function(resultset, sqlerror) {
       console.warn('DB query error: ', sqlerror, resultset);
       this.error(sqlerror, resultset);
    },

	Find: function(what, filters, sorting, justthese, options) {
		builder = new QueryBuilder(what, filters, sorting, justthese, options);
		var query = builder.buildQuery();
		console.log("Executing query: ", options, query);
		$(document.body).addClass('wait');

		this.db.execute(query, { 
			onComplete: function(resultSet) { console.log("Query done! firing oncomplete");
			this.onComplete(what, resultSet, options); }.bind(this),
			onError: this.onError.bind(this)
		});
	},
		
	Save: function(what) {
		console.error("Save in dbobject.sqliteadapter!", what);

	}
});


