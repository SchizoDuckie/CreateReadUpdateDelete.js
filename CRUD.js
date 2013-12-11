
if (!CRUD) var CRUD = {
	RELATION_SINGLE : 1,
	RELATION_FOREIGN : 2,
	RELATION_MANY : 3,
	RELATION_CUSTOM : 6
};


CRUD.define = function(opts, method) {
	return function(ID) {
		if(ID) {
			console.log("Found id! ", ID);
		}
		var s = new CRUD.Entity(opts, method);
		return s;
	};
};

/**
 * CRUD.Find is probably the function that you'll use most to query things:
 *
 * Syntax:
 * CRUD.Find(Product, { Catalog: { ID: 1 }}, {
 function *			onSuccess(products) {
 *				for(var i=0; i< products.length; i++) {
 *					$$(".body")[0].adopt(products[i].display());
 *				}
 *			},
 function *			onError(error) {
 *				console.debug("Error in finding CRUD.find products for catlog!!", error);
 *			}
 *		});
 *
 * Searches for products connected to catalog id #1
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
	obj.getAdapter().Find(type, filters, extras, justthese, options, filters);
};
			
CRUD.FindOne = function(obj, filters, options) {
	options.limit = 1;
	var os = options.onSuccess;
	options.onSuccess = function(res) {
		os(res[0]);
	};
	return this.Find(obj, filters, options);
};


CRUD.fromCache = function(obj, values) {
	try {
		obj = (typeof obj == 'function') ? new obj() : new window[obj]();
		type = (obj && obj.toString() == 'CRUD') ? obj.getType() : false;
	} catch (E) {
		console.error("CRUD.fromCache cannot create for non-CRUD objects like "+obj+"! \n"+E);
		return false;
	}
	obj.databaseValues = values;
	obj.dbSetup.ID = obj.databaseValues[obj.dbSetup.primary];
	return obj;
};

CRUD.ConnectionAdapter = function(endpoint, options) {
	
	this.endpoint = endpoint || false;
	this.options = options ? this.filterOptions(options) : {};
	
	this.filterOptions = function(options) {
		this.success = options.onSuccess || function(a,b) { console.log("Unhandled result! Missing onSuccess?", a,b); };
		this.error = options.onError || function(a,b) { console.info("Error!", a,b); };
		
		delete options.onSuccess;
		delete options.onError;
		return options;
	};
	return this;
};


CRUD.Entity = function(options, methods) {
	this.dbSetup = {
		className: 'CRUD.Entity',
		ID: false,
		table: false,
		primary: false,
		fields: [],
		defaultValues: {},
		adapter: 'dbAdapter',
		orderProperty: false,
		orderDirection: false,
		relations: {},
		connectors: {},
		createStatement: false,
	};
	this.databaseValues = {};
	this.changedValues = {};
	this.isDirty = false;
	this.customData = {};
	this._customProperties = [];// custom properties to send along to the adapter (handy for form persists)

	for(var i in options) {
		if(i in this.dbSetup) this.dbSetup[i] = options[i];
	}
	for(var j in methods) {
		this[j] = methods[j];
	}
	var self = this;


	this.__setupDatabase = function (ID, dbSetup) {
			this.dbSetup.ID = ID || false;
			if(this.dbSetup.ID !== false) {
			this.Find({"ID" : ID});
			}
		};

	this.getID = function () {
		return this.dbSetup.ID;
	};

	this.getAdapter = function () {
		var adapter = typeof this.dbSetup.adapter == "string" ? window[this.dbSetup.adapter] : this.dbSetup.adapter;
		if(!adapter) throw("[CRUD] Exception in getAdapter, cannot find an instance of "+this.dbSetup.adapter+" for entity "+this.dbSetup.className+ "- "+ window[this.dbSetup.adapter]);
		return adapter;
	};

	/** 
	 * Proxy find function, that can be run on the entity itself.
	 * Makes sure you can create object A, and find just relations connected to it.
	 */
	this.Find = function(type, filters, options) {
		filters = filters || {};
		filters[this.getType()] = {} ;
		filters[this.getType()][this.dbSetup.primary] = this.getID();
		return CRUD.Find(type, filters, options);
	};

	/**
	 * Get al list of all the values to display.
	 */
	this.getValues = function () {
		var v = this.databaseValues;
		if(this.changedValues && Array.from(this.changedValues).length > 0) {
			for(var k in this.changedValues) {
				v[k] = this.changedValues[k];
			}
		}
		v.ID = this.getID();
		return v;
	};

	this.hasField = function (fieldname) {
		return(this.dbSetup.fields.indexOf(fieldname) > -1);
	};

	this.importValues = function (values) {
		var fields = this.dbSetup.fields, pri = this.dbSetup.primary;
		for(var i= 0; i < fields.length; i++) {
			var field = fields[i];
			this.databaseValues[field] = values[field];
			if (field == pri) this.dbSetup.ID = values[field];
		}
		return this;
	};

	/**
	 * Accessor. Gets one field, optionally returns the default value.
	 */
	this.get = function (field, def) {
		if(this.changedValues[field]) { return this.changedValues[field] ;}
		if(this.databaseValues[field]) { return this.databaseValues[field];}
		if(!this.hasField(field)) {
			console.error("Could not find field '"+field+ "' in '"+ this.getType()+"' for getting.");
		} else {
			return def || '';
		}
	};

	/**
	 * Setter, accepts key / value or object with keys/values
	 */
	this.set = function (field, value) {
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
	};

	/**
	 * Persist changes on object using CRUD.Entity.set through the adapter.
	 */
	this.Persist = function (callbacks) {
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

			that.getAdapter().Persist(that).then(
				function(result) {
					that.onPersisted(result);
					resolve(result);
				}, function(e) {
					console.error("Error saving CRUD", that, e);
					fail(e);
				}
			);

		});
	};
	
	/**
	 * Default persist callback. for internal use
	 */
	this.onPersisted = function (result) {
		console.error("onPersisted! ", result);
		this.isDirty = false;
		if(result.Action == 'inserted' && this.getID() === false) {
			this.databaseValues = result.Result;
			this.changedValues = [];
			this.dbSetup.ID = this.databaseValues[this.dbSetup.primary];
		}
		else if (result.Action == 'updated') {
			this.changedValues = [];
			for( var i in this.dbSetup.fields) {
				var field = this.dbSetup.fields[i];
				if(result.Result[0][field]) {
					this.databaseValues[field] = result.Result[0][field];
				}
			}
		}
		console.warn(this.getType()+" has been persisted. Result: " + result.Action + ". New Values: "+JSON.stringify(this.databaseValues));
		//alert('CRUD has been persisted! ', result);
	};

	/** 
	 * Default delete callback, for internal use
	 */
	this.onDeleted = function (result) {
		if(result.Action == 'deleted') {
			console.warn(this.getType()+" "+this.getID()+" has been deleted! ");
			this.dbSetup.ID = false;
		}
	};

	/**
	* Delete the object via the adapter.
	* Allows you to call Persist() again on the same object by just setting the ID to false.
	*/
	this.Delete = function() {
		var that = this;
		new Promise(function(resolve, fail) {
			that.getAdapter().Delete(that).then(function(e) {
				that.onDeleted(e);
				resolve(e)
			}, fail);
		}
	};

	/**
	 * override toString for easy detection of CRUDs
	 */
	this.toString = function () {
		return 'CRUD';
	};

	/** 
	 * Returns the actual className. Should be provided in the entity object.
	 * Might not look best, but saves a lot of hassle with reflection
	 */
	this.getType = function () {
		return(this.dbSetup.className);
	};

	this.Connect = function(to, events) {
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
	};

	this.Disconnect = function(from, events) {
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
							target.deleteYourself().then(resolve, fail);
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
	};

	/** 
	 * Tiny private clone function
	 */
    function _clone(obj) {
		var clone = {};
        for(var i in obj) {
            clone[i] = (typeof(obj[i])=="object") ? _clone(obj[i]) : obj[i];
        }
        return clone;
    }

	return this;
};
