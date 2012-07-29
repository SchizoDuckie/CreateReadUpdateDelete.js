/*
---

Database.js
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
...
*/

Database = function(name, options) {

	this.options = {
		version: '1.0',
		estimatedSize: 655360
	};
	this.lastInsertRowId = 0;
	this.db = false;
	this.dbName = false;
	
			
	if(options) this.options = options;
	this.dbName = name;
	this.db = openDatabase(this.dbName, this.options.version, '', this.options.estimatedSize);
	this.dbVersion = this.db.version;

	if (!this.db) {
		alert("Failed to open database!");
	}


	this.execute = function(sql, options){
		if(!this.db) return;
		//console.log("Execute! ", sql, options);
		options = Objectmerge({
			values: [],
			onComplete: function(r){console.log("Database result retrieved: ", r)},
			onError: function(e, f){ console.error(sql, e,f);}
		}, options);
		//console.log("Query: ", sql, options.values);
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

	this.getVersion = function(){
		return this.dbVersion;
	};

	this.changeVersion = function(from, to){
		if(this.html5)
			this.db.changeVersion(from, to);
		else
			this.db.execute('UPDATE DATABASE_METADATA SET version = ? WHERE version = ?', [to, from]);
			
		this.dbVersion = to;
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


Objectmerge = function(obj1, obj2) {
	for (var p in obj2) {
		try { // Property in destination object set; update its value.
			obj1[p] = obj2[p].constructor==Object ?  Objectmerge(obj1[p], obj2[p]) :  obj2[p];
		} catch(e) { // Property in destination object not set; create it and set its value.
			obj1[p] = obj2[p];
		}
	}
	return obj1;
};