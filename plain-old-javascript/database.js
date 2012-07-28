/*
---

Database.js
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
...
*/

var Database = function(name, options) {

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


	function execute(sql, options){
		if(!this.db) return;
		options = Object.merge({
			values: [],
			onComplete: function(){},
			onError: function(){}
		}, options);
		this.db.transaction(function(transaction){
			transaction.executeSql(sql, options.values, function(transaction, rs){
				try {
					this.lastInsertRowId = rs.insertId;
				} catch(e) {}
				if (options.onComplete)
					options.onComplete(new Database.ResultSet(rs));
			}.bind(this), options.onError);
		}.bind(this));
	}
	
	function lastInsertId(){
		return this.lastInsertRowId;
	}
	
	function getVersion(){
		return this.dbVersion;
	}
	
	function changeVersion(from, to){
		if(this.html5)
			this.db.changeVersion(from, to);
		else
			this.db.execute('UPDATE DATABASE_METADATA SET version = ? WHERE version = ?', [to, from]);
			
		this.dbVersion = to;
	}
	
	function close(){
		this.db.close();
	}

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