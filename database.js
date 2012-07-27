/*
---

script: Database.js

description: Offers a Mootools way to interface with html5 databases (also known as "persistent storage"). Tries to use google gears if no html5 database is found.

authors: Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>

copyright: Copyright (c) 2009 Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>

license: MIT-style license.

version: 0.9.4

requires: core:1.2.4: '*'

provides: Database

...
*/
console.debug("DB support? ", window.openDatabase, window.GearsFactory);

window.addEvent('domready', function(){
	window.Browser = Object.merge({
	
		Database: {name: window.openDatabase ? 'html5' : 'unknown' }
	
	}, window.Browser || {});
})

var Database = new Class({
	
	Implements: [Options],
	
	options: {
		version: '1.0',
		estimatedSize: 655360,
	},
	
	initialize: function(name, options){
		
		if (!Browser.loaded)
			alert('Database: Please wait until the DOM is ready!');
		
		this.setOptions(options);
		
		if (Browser.Database.name == 'unknown') {
			return;
		}
		
		this.html5 = Browser.Database.name == 'html5';
		
		this.dbName = name;
		
		if (this.html5) {
			this.db = openDatabase(this.dbName, this.options.version, '', this.options.estimatedSize);
			this.dbVersion = this.db.version;
		} 		
		if (!this.db)
			alert(MooTools.lang.get('Database', 'failedToOpenDatabase'));
		
		this.lastInsertRowId = 0;
	},
	
	execute: function(sql, options){
		if(!this.db) return;
		options = Object.merge({
			values: [],
			onComplete: function(){},
			onError: function(){}
		}, options);
		if (this.html5) 
			this.db.transaction(function(transaction){
				transaction.executeSql(sql, options.values, function(transaction, rs){
					try {
						this.lastInsertRowId = rs.insertId;
					} catch(e) {}
					if (options.onComplete) 
						options.onComplete(new Database.ResultSet(rs));
				}.bind(this), options.onError);
			}.bind(this));
		
	},
	
	lastInsertId: function(){
		return this.lastInsertRowId;
	},
	
	getVersion: function(){
		return this.dbVersion;
	},
	
	changeVersion: function(from, to){
		if(this.html5)
			this.db.changeVersion(from, to);
		else
			this.db.execute('UPDATE DATABASE_METADATA SET version = ? WHERE version = ?', [to, from]);
			
		this.dbVersion = to;
	},
	
	close: function(){
		this.db.close();
	},
	
	destroy: function(){
		if(this.html5){
			// html5 seems not offering a method to remove databases
			// "DROP DATABASE " + dbName; Does not the trick
		} else
			this.db.remove(); // And in gears itÂ´s not always working :(
	}
});

Database.ResultSet = new Class({
	
	initialize: function(rs){
		this.html5 = Browser.Database.name == 'html5';
		this.rs = rs;
		this.index = 0;
	},
	
	next: function(){
		var row = null;
		
		if(this.html5 && this.index < this.rs.rows.length){
			row = new Database.ResultSet.Row(this.rs.rows.item(this.index++));
		}
		else if(!this.html5){
			if(this.index > 0)
				this.rs.next();
			if (this.rs.isValidRow()) {
				row = new Database.ResultSet.Row(this.rs);
				this.index++;
			} else
				this.rs.close();
		}
		return row;
	}
});

Database.ResultSet.Row = new Class({
	
	initialize: function(row){
		this.html5 = Browser.Database.name == 'html5';
		this.row = row;
	},
	
	get: function(index, defaultValue){
		var col = null;
		
		if (this.html5) 
			col = this.row[index];
		else
			col = $type(index) == 'string' ? this.row.fieldByName(index) : this.row.field(index);
		
		return $chk(col) ? col : defaultValue;
	}
});

// Avoiding MooTools.lang dependency
(function() {
	var phrases = {
		'noValidDatabase': 'No valid database found!',
		'failedToOpenDatabase': 'Failed to open the database on disk. This is probably because the version was bad or there is not enough space left in this domain quota'
	};
	 
	if (MooTools.lang) {
		MooTools.lang.set('en-US', 'Database', phrases);
	} else {
		MooTools.lang = {
			get: function(from, key) {
				return phrases[key];
			}
		};
	}
})();