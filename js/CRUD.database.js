/*
---

Database.js, a simple database abstraction layer.
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
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
	this.db = openDatabase(this.dbName, this.options.version, '', this.options.estimatedSize);
	if (!this.db) {	alert("Failed to open database "+this.dbName+"!"); }

	this.execute = function(sql, options){
		if(!this.db) return;
		options = Objectmerge({
			values: [],
			onComplete: function(r){ console.log("Database result retrieved: ", r); },
			onError: function(e, f){ console.error(sql, e,f);}
		}, options);
		this.db.transaction(function(transaction){
			transaction.executeSql(sql, options.values, function(transaction, rs){
				try {
					if(insertId in rs) {
						this.lastInsertRowId = rs.insertId;
					}
				} catch(E) {}
				if (options.onComplete)
					options.onComplete(new Database.ResultSet(rs));
				}.bind(this), options.onError);
		}.bind(this));
	};

	this.lastInsertId = function(){
		return this.lastInsertRowId;
	};

	this.close = function (){
		this.db.close();
	};
	return this;
};

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
};

Objectmerge = function(a, b) {
	for (var p in a) {
		try { a[p] = b[p].constructor==Object ?  Objectmerge(a[p], b[p]) :  b[p]; } catch(e) { a[p] = b[p]; }
	}
	return a;
};