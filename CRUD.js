
if (!CRUD) var CRUD = {
	RELATION_SINGLE : 1,
	RELATION_FOREIGN : 2,
	RELATION_MANY : 3,
	RELATION_CUSTOM : 'banana'
};


/** 
 * The main object proxy that returns either a fresh entity object or a promise that loads data, when you pass the primary key value to search for.
 *
 * The main idea behind this is that you can do:
 * var Project = CRUD.define(dbSetup, methods)
 * var p = new Project(); // now you can use get/set on p, after which you can use p.Persist().then(function() {} );
 * new Project(20).then(function(project) { project with id 20 has been fetched from adapter, use it here. })
 */


CRUD.EntityManager = (new function() {

	this.entities = {};
	this.cache = {};
	this.connectionAdapter = false;

	this.defaultSetup = {
		className: 'CRUD.Entity',
		ID: false,
		table: false,
		primary: false,
		fields: [],
		defaultValues: {},
		adapter: false,
		orderProperty: false,
		orderDirection: false,
		relations: {},
		connectors: {},
		createStatement: false,
	};

	/**
	 * Register a new entity into the entity manager, which will manage it's properties, relations, and data.
	 */
	this.registerEntity = function(className, dbSetup) {
		console.log("Register entity", dbSetup);
		if(!(className in this.entities)) {
			this.entities[className] = this.defaultSetup;
		}
		for(var i in dbSetup) {
			this.entities[className][i] = dbSetup[i];
		}
	}

	this.getPrimary = function(className) {
		return this.entities[className].primary;
	}

	/** 
	 * Set and initialize the connection adapter.
	 */
	this.setAdapter = function(adapter) {
		this.connectionAdapter = adapter;
		return new Promise(function(resolve, fail) {
			this.connectionAdapter.Init().then(resolve, fail);
		}.bind(this));
	}

	this.getAdapter = function() {
		return this.connectionAdapter;
	}

	return this;



}());

CRUD.define = function(properties, methods) {
	console.log("Define entity!", properties, methods);
	CRUD.EntityManager.registerEntity(properties.className, properties);
	var props = properties;
    return function(ID) {
    	console.log(props);
	   var el = new CRUD.Entity(props.className, methods);
	   return ID ? el.primaryKeyInit(ID) : el;
    }
};
	
CRUD.setAdapter = function(adapter) {
	return CRUD.EntityManager.setAdapter(adapter);
}

CRUD.getAdapter = function() {
	return  CRUD.EntityManager.getAdapter();
};


/**
 * CRUD.Find is probably the function that you'll use most to query things:
 *
 * Syntax:
 * CRUD.Find(Product, { Catalog: { ID: 1 }} ).then( function(products) {
 *		for(var i=0; i< products.length; i++) {
 *			$$(".body")[0].adopt(products[i].display());
 *		}
 *	}, function(error) { console.debug("ERROR IN CRUD.FIND for catalog 1 ", error); });
 */
CRUD.Find = function(obj, filters, options) {
	var type = false;
	
	if(obj.toString() == 'CRUD') {
		type = obj.getType();
	} else {
		try {
			obj = (typeof obj == 'function') ? new obj() : new window[obj]();
			type = (obj && obj.toString() == 'CRUD') ? obj.getType() : false;
		} catch (E) {
			console.error("CRUD.Find cannot search for non-CRUD objects like "+obj+"! \n"+E);
			return false;
		}
	}
	if(obj.getID() !== false) {
		filters.ID = obj.getID();
		filters.type = filters
	}
	var extras = [];
	options = options || {};
	if(filters.limit) {
		extras.limit = (options.start || 0) + "," + options.limit;
	}
	var justthese = options.justthese || [];
	return obj.getAdapter().Find(type, filters, extras, justthese, options, filters);
};

/** 
 * Uses CRUD.find with a limit 0,1 and returns the first result.
 * @returns Promise
 */			
CRUD.FindOne = function(obj, filters, options) {
	var that = this;
	return new Promise(function(success, error) {
		options.limit = 1;
		that.Find(obj, filters, options).then(function(result) {
			success(result[0]);
		}, error);

	});
};


CRUD.fromCache = function(obj, values) {
	try {
		obj = (typeof obj == 'function') ? new obj() : new window[obj]();
		type = (obj && obj.toString() == 'CRUD') ? obj.getType() : false;
	} catch (E) {
		console.error("CRUD.fromCache cannot create for non-CRUD objects like "+obj+"! \n"+E);
		return false;
	}
	obj.values = values;
	obj.dbSetup.ID = obj.values[obj.dbSetup.primary];
	return obj;
};

/**
 * Default interface for a connection.
 * Implement these methods for a new adapter.
 */
CRUD.ConnectionAdapter = function(endpoint, options) {
	this.endpoint = endpoint || false;
	this.options = options || {};

	this.Init = function() { console.log("The Init method for you connection adapter is not implemented!"); debugger; };
	this.Delete = function(what, events) { console.log("The Delete method for your connection adaptor is not implemented!"); debugger; };
	this.Persist = function(what) { console.log("The Persist method for your connection adaptor is not implemented!"); debugger;  }; 
	this.Find = function(what, filters, sorting, justthese, options, filters) { console.log("The Find method for your connection adaptor is not!"); debugger;  };
	return this;
};

CRUD.Entity = function(className, methods) {
	this.className = className;
	
	this.values = {};
	this.changedValues = {};
	this.isDirty = false;
	this.customData = {};
	this._customProperties = [];// custom properties to send along to the adapter (handy for form persists)

	for(var j in methods) {
		this[j] = methods[j];
	}
	var that = this;
	return this;
};


CRUD.Entity.prototype = {
	
	getID : function () {
		return this.get(CRUD.EntityManager.getPrimary(this.getType()));
	},

	getAdapter : function () {
		var adapter = typeof this.dbSetup.adapter == "string" ? window[this.dbSetup.adapter] : this.dbSetup.adapter;
		if(!adapter) throw("[CRUD] Exception in getAdapter, cannot find an instance of "+this.dbSetup.adapter+" for entity "+this.dbSetup.className+ "- "+ window[this.dbSetup.adapter]);
		return adapter;
	},

	/** 
	 * Proxy find function, that can be run on the entity instance itself.
	 * Makes sure you can create object A, and find just relations connected to it.
	 * example:
	 * 
	 * var Project = new Project(1).then(function(proj) {  proj.find(Catalog).then(function( catalogs) { console.log("Fetched catalogs!", catalogs); }});
	 * // versus
	 * var Project = CRUD.Find(Project, { ID : 1 }).then(function(proj) { console.log("Found project 1", proj); });
	 * // or use a join:
	 * CRUD.Find(Project, { Catalog: { ID: 1 }}).then(function(projects) { console.log("Found projects connected to catalog 1 !", projects); });
	 *
	 * @returns Promise
	 */
	Find : function(type, filters, options) {
		filters = filters || {};
		filters[this.getType()] = {} ;
		filters[this.getType()][this.dbSetup.primary] = this.getID();
		return CRUD.Find(type, filters, options);
	},

	/**
	 * Get al list of all the values to display.
	 */
	getValues: function () {
		var v = this.values;
		if(this.changedValues && Array.from(this.changedValues).length > 0) {
			for(var k in this.changedValues) {
				v[k] = this.changedValues[k];
			}
		}
		v.ID = this.getID();
		return v;
	}, 

	hasField: function (fieldname) {
		return(this.dbSetup.fields.indexOf(fieldname) > -1);
	},

	importValues: function (values) {
		var fields = this.dbSetup.fields, pri = this.dbSetup.primary;
		for(var i= 0; i < fields.length; i++) {
			var field = fields[i];
			this.values[field] = values[field];
			if (field == pri) this.dbSetup.ID = values[field];
		}
		return this;
	},

	/**
	 * Accessor. Gets one field, optionally returns the default value.
	 */
	get: function (field, def) {
		if(this.changedValues[field]) { return this.changedValues[field] ;}
		if(this.values[field]) { return this.values[field];}
		if(!this.hasField(field)) {
			console.error("Could not find field '"+field+ "' in '"+ this.getType()+"' for getting.");
		} else {
			return def || '';
		}
	},

	/**
	 * Setter, accepts key / value or object with keys/values
	 */
	set: function (field, value) {
		if(typeof field === "object") {
			for(var i in field) {
				if(field.hasOwnProperty(i) && this.hasField(i)) {
					this.set(i, field[i]);
				}
			}
			return;
		}
		if(this.hasField(field)) {
			if(this.get(field) != value) {
				this.changedValues[field] = value;
				this.isDirty = true;
			}
		} else if (this._customProperties.indexOf(field) > -1) {
				this.customData[field] = value;
		} else {
			console.error("Could not find field '"+field+"' in '"+ this.getType()+"' for setting.");
		}
	}, 

	/**
	 * Persist changes on object using CRUD.Entity.set through the adapter.
	 */
	Persist: function (callbacks) {
		var that = this;
		new Promise(function(resolve, fail) {

			if(!this.isDirty) return resolve();

			if(that.dbSetup.ID === false) {
				if(that.dbSetup.defaultValues) {
					for(var i in that.dbSetup.defaultValues) {
						if(that.dbSetup.defaultValues.hasOwnProperty(i) && !that.changedValues[i]) {
							that.changedValues[i] = that.dbSetup.defaultValues[i];
						}
					}
				}
			}

			that.getAdapter().Persist(that).then(function(result) {
					console.error("onPersisted! ", result);
					this.isDirty = false;
					if(result.Action == 'inserted' && this.getID() === false) {
						this.values = result.Result;
						this.changedValues = [];
						this.dbSetup.ID = this.values[this.dbSetup.primary];
					}
					else if (result.Action == 'updated') {
						this.changedValues = [];
						for( var i in this.dbSetup.fields) {
							var field = this.dbSetup.fields[i];
							if(result.Result[0][field]) {
								this.values[field] = result.Result[0][field];
							}
						}
					}
					console.warn(this.getType()+" has been persisted. Result: " + result.Action + ". New Values: "+JSON.stringify(this.values));
					resolve(result);
				}, function(e) {
					console.error("Error saving CRUD", that, e);
					fail(e);
				}
			);

		});
	},




	/**
	* Delete the object via the adapter.
	* Allows you to call Persist() again on the same object by just setting the ID to false.
	*/
	Delete: function() {
		var that = this;
		return new Promise(function(resolve, fail) {
			that.getAdapter().Delete(that).then(function(result) {
				if(result.Action == 'deleted') {
					console.warn(that.getType()+" "+that.getID()+" has been deleted! ");
					this.dbSetup.ID = false;
				};
				resolve(result);
			}, fail);
		});
	},

	/**
	 * override toString for easy detection of CRUDs
	 */
	toString: function () {
		return 'CRUD';
	},

	/** 
	 * Returns the actual className. Should be provided in the entity object.
	 * Might not look best, but saves a lot of hassle with reflection
	 */
	getType: function () {
		return(this.className);
	},

	/** 
	 * Connect 2 entities regardles of their relationship type.
	 * Pass the object you want to connect this entity to to this function and
	 * this will find out what it needs to do to set the correct properties in your persistence layer.
	 * @TODO: update thisPrimary, thatPrimary resolve functions to allow mapping using RELATION_CUSTOM, also, using identified_by propertys
	 */
	Connect: function(to, events) {
		var targetType = to.getType();
		var thisType = this.getType();
		var thisPrimary = this.dbSetup.primary; 
		var targetPrimary = to.dbSetup.primary;
		var that = this;
		new Promise(function(resolve, fail) {
			Promise.all([that.Persist(), to.Persist()]).then(function() {
				switch(that.dbSetup.relations[targetType]) {
					case CRUD.RELATION_SINGLE:
						to.set(thisPrimary, that.getID());
						that.set(targetPrimary, to.getID());
					break;
					case CRUD.RELATION_FOREIGN:
						if(to.hasField(thisPrimary)) {
							to.set(thisPrimary, that.getID());
						}
						if(that.hasField(targetPrimary)) {
							that.set(targetPrimary, to.getID());
						}
					break;
					case CRUD.RELATION_MANY:
						var connector = new window[that.dbSetup.connectors[targetType]]();
						connector.set(thisPrimary, that.getID());
						connector.set(targetPrimary, to.getID());
						connector.Persist().then(resolve, fail);
						return;
					break;
					case CRUD.RELATION_CUSTOM:
						//@TODO
					break;
				}
				if(that.dbSetup.relations[to.getType()] != CRUD.RELATION_MANY) {
					Promise.all([to.Persist(), from.Persist()]).then(resolve, fail);	
				}
			}, fail);
		});
	},

	Disconnect: function(from, events) {
		var targetType = from.getType();
		var thisType = this.getType();
		var thisPrimary = this.dbSetup.primary;
		var targetPrimary = from.dbSetup.primary;
		var that = this;

		new Promise(function (resolve, fail) {
			Promise.all([that.Persist(), from.Persist()]).then(function() {
				switch(this.dbSetup.relations[from.getType()]) {
					case CRUD.RELATION_SINGLE:
						from.set(thisPrimary, null);
						that.set(targetPrimary, null);
					break;
					case CRUD.RELATION_FOREIGN:
						if(from.hasField(thisPrimary)) {
							from.set(thisPrimary, null);
						}
						if(that.hasField(targetPrimary)) {
							that.set(targetPrimary, null);
						}
					break;
					case CRUD.RELATION_MANY:
						var filters = {};
						filters[thisPrimary] = this.getID();
						filters[targetPrimary] = from.getID();

						CRUD.FindOne(this.dbSetup.connectors[targetType], filters).then(function(target) {
							target.Delete().then(resolve, fail);
						}, fail);
						return;
					break;
					case CRUD.RELATION_CUSTOM:
						// TODO: implement.
					break;
				}
				Promise.all([that.Persist(), this.Persist()]).then(resolve, fail);
			}, fail);
		});
	},


	primaryKeyInit: function (ID) {
		this.dbSetup.ID = ID || false;
		if(this.dbSetup.ID !== false) {
			return this.Find({"ID" : ID});
		}
	}
}