/*
---

Database.js, a simple database abstraction layer.
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
December 2013: Updated for use of promises.
...
*/
Database = function(name, options) {
	this.options = options || {
		version: '1.0',
		estimatedSize: 655360
	};

	this.lastInsertRowId = 0;
	this.db = false;
	this.dbName = name || false;

	this.lastInsertId = function(){
		return this.lastInsertRowId;
	};

	this.close = function (){
		return this.db.close();
	};

	/** 
	 * Execute a db query and promise a resultset.
	 */ 
	this.execute = function(sql, valueBindings){
		if(!this.db) return;
		var that = this;
		return new Promise(function(resolve, fail) {

			that.db.transaction(function(transaction){
				console.log("execing sql: ", sql);
				transaction.executeSql(sql, valueBindings, function(transaction, rs){
					resolve(new Database.ResultSet(rs));
				}, function(transaction, error) { 
					fail(error, transaction) 
				});
			});
		});
	}

	this.connect= function() {
		var that = this;
		return new Promise(function(resolve, fail) { 
			try {
				that.db = openDatabase(that.dbName, that.options.version, '', that.options.estimatedSize);
				if (!that.db) {
					fail("could not open database "+that.dbName);
				} else {
					console.log("DB connection to ", that.dbName, " opened!");
					resolve(this);
				}
			} catch(E) { 
				console.error("ERROR "+E.toString()); 
				fail('ERROR!'+e.toString(), E);
			}
		});
	};
}

Database.ResultSet = function(rs){
	this.rs = rs;
	this.index = 0;
	return this;
};

Database.ResultSet.prototype.next = function(){
	var row = null;
	if(this.index < this.rs.rows.length){
		row = new Database.ResultSet.Row(this.rs.rows.item(this.index++));
	}
	return row;
};

Database.ResultSet.Row = function(row) {
	this.row = row;
	return this;
};

Database.ResultSet.Row.prototype.get = function(index, defaultValue) {
	var col = this.row[index];
	return (col) ? col : defaultValue;
}
