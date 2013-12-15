CRUD.IndexedDBAdapter = function(database, dbOptions) {
	this.databaseName = database;
	this.dbOptions = dbOptions
	this.lastQuery = false;
	this.db = false;
	this.fixturesQueue = [];

	CRUD.ConnectionAdapter.apply( this, arguments );
	
	this.Init = function() {
		var that = this;
		return new Promise(function(resolve, fail) {
			var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
			var e  = indexedDB.open(that.databaseName, Number(1));
			e.onupgradeneeded = that.verifyTables.bind(that);
			e.onsuccess = function(e) {
				that.db = e.target.result;
				CRUD.log("IndexedDB connection created to ", that.databaseName);
				that.importFixtures().then(function() {
					resolve();					
				});
			};
			e.onerror = function(e) { fail(e.target.error) }
		});
	};

	this.importFixtures = function() {
		var pq = [];
		for( var i =0; i<this.fixturesQueue.length; i++) {
			var entity = CRUD.EntityManager.entities[this.fixturesQueue[i]]
			CRUD.log(entity.fixtures.length + ' Fixtures found for '+entity.className+' inserting.')
			for(var j=0; j<entity.fixtures.length; j++) {
				pq.push(CRUD.fromCache(entity.className, entity.fixtures[j]).Persist(true, 'INSERT'));
			}
		}
		return Promise.all(pq);
	};

	this.verifyTables = function(e) {
		CRUD.log('verifying that tables are in sync');
		this.db = e.target.result;
        for(var i in CRUD.EntityManager.entities) {
			var entity = CRUD.EntityManager.entities[i];
			CRUD.log("Creating objectstore for ", entity.className);
			if(!(this.db.objectStoreNames.contains(entity.className))) {
				var store = this.db.createObjectStore(entity.className, {
	                keyPath: entity.primary,
	                autoIncrement: true
	            });
	            for(var key in entity.keys) {
	            	store.createIndex(key,key, {unique:false});	
	            }
	            if(entity.fixtures.length > 0) {
	            	this.fixturesQueue.push(entity.className);
				}
				for(var related in entity.relations) {
					switch(entity.relations[related]) {
						case CRUD.RELATION_SINGLE:
						case CRUD.RELATION_FOREIGN:
							var rel = CRUD.EntityManager.entities[related];
							if( CRUD.EntityManager.entities[related]) {
								if(rel && rel.primary) {
									CRUD.log("Creating indexes for relation keys: ",related, rel.primary);
									store.createIndex(rel.primary,rel.primary, {unique:false});	
								}
							}
						break;
					}
				}
	         
	        }
        }
    }
	
	this.Find = function(what, filters, sorting, justthese, options, filters) {

		var that = this;
	
		CRUD.log("Executing query via Indexeddbadapter: ", what, filters);
		return new Promise(function(resolve, fail) {
			var output = [];
			if(Object.keys(filters).length == 1) {
				var key = Object.keys(filters)[0];
				if(key == 'ID' || key == CRUD.EntityManager.entities[what].primary) {	
					var request = that.db.transaction(what).objectStore(what).get(filters[key]);
					request.onsuccess = function(event) {
						console.log("Found!", event.target.result);
						resolve(output.push(CRUD.EntityManager.constructors[what]().importValues(event.target.result)));
					};
					request.onerror = function(e) {
						CRUD.log('IndexeDB Error in FIND : ',e, what, this);
						debugger;
						fail();
					}
				}
			}
		});
	}

	this.Persist = function(what, forceInsert) {
		console.log("Persisting! ", what,forceInsert);
		var that = this;
		var trans = this.db.transaction(what.className,'readwrite');
        var store = trans.objectStore(what.className);
        var newValues = what.values;
        for(var i in what.changedValues) {
        	newValues[i] = what.changedValues[i];
        } 
        for(var j in what.defaultValues) {
        	if(!(j in newValues)) {
        		newValues[j] = what.defaultValues[j];
        	}
        }
        return new Promise(function(resolve, fail) {
        	var request = store.put(newValues);
	        request.onsuccess = resolve;
	        request.onerror = fail;
        });
	}

	this.Delete = function(what, events) {
		var query = [], values = [], valmap = [], names=[], that=this;
		var trans = this.db.transaction([what], 'readwrite');
        var store = trans.objectStore(what);
		if(what.getID() !== false) {
			return new Promise(function(resolve, fail) {
				var request = store.delete(what.getID());
				request.onsuccess = function(e) {
					e.Action = 'deleted';
					resolve(e);
				};
				request.onerror = function(e) {
					CRUD.log("error deleting element from db: ", e);
					fail(e);
				};
			});
		} else {
			return new Promise(function(resolve, fail) { fail(); });
		}
	}

	return this;
};