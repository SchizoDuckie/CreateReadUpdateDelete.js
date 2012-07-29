
if (!dbObject) var dbObject = {
	RELATION_SINGLE : 1,
	RELATION_FOREIGN : 2,
	RELATION_MANY : 3,
	RELATION_CUSTOM : 6
};


dbObject.define = function(opts, method) {
	return function(ID) {
		if(ID) {
			console.log("FOund id! ", ID);
		}
		var s = new dbObject.Entity(opts, method);
		return s;
	};
};

/**
 * dbObject.Find is probably the funciton that you'll use most to query things:
 *
 * Syntax:
 * dbObject.Find(Product, { Catalog: { ID: 1 }}, {
 function *			onSuccess(products) {
 *				for(var i=0; i< products.length; i++) {
 *					$$(".body")[0].adopt(products[i].display());
 *				}
 *			},
 function *			onError(error) {
 *				console.debug("Error in finding dbObject.find products for catlog!!", error);
 *			}
 *		});
 *
 * Searches for products connected to catalog id #1
 */
dbObject.Find = function(obj, filters, options) {
	var type = false;
	if(obj.toString() == 'dbObject') {
		type = obj.getType();
	} else {
		try {
			obj = (typeof obj == 'function') ? new obj() : new window[obj]();
			type = (obj && obj.toString() == 'dbObject') ? obj.getType() : false;
		} catch (E) {
			console.error("dbObject.Find cannot search for non-dbObject objects like "+obj+"! \n"+E);
			return false;
		}
	}

	if(obj.getID() !== false) {
		filters = {
			ID : obj.getID(),
			type : filters
		};
	}
	//console.log("Find! ", type, filters, options);
	
	var extras = [];
	options = options || {};
	if(options.limit) {
		extras.limit = (options.start || 0) + "," + options.limit;
		delete options.limit;
		delete options.start;
	}
	var justthese = [];
	
	obj.getAdapter().Find(type, filters, extras, justthese, options);
};
			
dbObject.FindOne = function(obj, filters, options) {
	options.limit = 1;
	var os = options.onSuccess;
	options.onSuccess = function(res) {
		os(res[0]);
	};
	return this.Find(obj, filters, options);
};


dbObject.fromCache = function(obj, values) {
	try {
			obj = (typeof obj == 'function') ? new obj() : new window[obj]();
			type = (obj && obj.toString() == 'dbObject') ? obj.getType() : false;
		} catch (E) {
			console.error("dbObject.fromCache cannot create for non-dbObject objects like "+obj+"! \n"+E);
			return false;
		}

	obj.databaseValues = values;
	obj.dbSetup.ID = obj.databaseValues[obj.dbSetup.primary];
	return obj;
};

dbObject.ConnectionAdapter = function(endpoint, options) {
	
	this.endpoint = endpoint || false;
	this.options = options ? this.filterOptions(options) : {};
	
	this.filterOptions = function(options) {
		this.success = options.onSuccess || function(a,b) { console.log("Unhandled result! Missing onSuccess?", a,b); };
		this.error = options.onError || function(a,b) { console.info("Error!", a,b); };
		
		delete options.onSuccess;
		delete options.onError;
		return options;
	}
	return this;
};


dbObject.Entity = function(options, methods) {
	this.dbSetup = {
		className: 'dbObject.Entity',
		table: false,
		primary: false,
		fields: [],
		ID: false,
		adapter: 'dbAdapter',
		orderProperty: false,
		orderDirection: false,
		relations: {},
		connectors: {},
	};
	this.databaseValues = {};
	this.changedValues = {};
	this.isDirty = false;
	this.customData = {};
	this._customProperties = [];// custom properties to send along to the adapter (handy for form saves)

	for(var i in options) {
		if(i in this.dbSetup) this.dbSetup[i] = options[i];
	}
	for(var i in methods) {
		this[i] = methods[i];
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
		if(!adapter) throw("[dbObject] Exception in getAdapter, cannot find an instance of "+this.dbSetup.adapter+" for entity "+this.dbSetup.className+ "- "+ window[this.dbSetup.adapter]);
		return adapter;
	};

	/** 
	 * Progy find function, that can be run on the entity itself.
	 * Makes sure you can create object A, and find just relations connected to it.
	 */
	this.Find = function(type, filters, options) {
		filters = filters || {};
		filters[this.getType()] = {} ;
		filters[this.getType()][this.dbSetup.primary] = this.getID();
		dbObject.Find(type, filters, options);
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
	 * Persist changes on object using dbObject.Entity.set through the adapter.
	 */
	this.Save = function (callbacks) {
		if(!callbacks.onComplete) {
			callbacks.onComplete = this.onSaved.bind(this);
		} else {
			callbacks.oldOnComplete = callbacks.onComplete;
			callbacks.onComplete = function(result) { 
				this.onSaved(result);
				callbacks.oldOnComplete(result);
			}.bind(this);
		}
		if(!callbacks.onError) {
			callbacks.onError = function(e) {
				console.error("Error saving dbObject", this, e);
			}.bind(this);
		}
		if(this.isDirty) {
			this.getAdapter().Save(this, callbacks);
		}
	};
	
	/**
	 * Default save callback. for internal use
	 */
	this.onSaved = function (result) {
		console.error("onSaved! ", result);
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
		console.warn(this.getType()+" has been saved. Result: " + result.Action + ". New Values: "+JSON.stringify(this.databaseValues));
		//alert('dbObject has been saved! ', result);
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
	* Allows you to call Save() again on the same object by just setting the ID to false.
	* @param callbacks object with optional onComplete / onError
	*/
	this.deleteYourself = function (callbacks) {
		if(!callbacks) callbacks = {};
		if(!callbacks.onComplete) {
			callbacks.onComplete = this.onDeleted.bind(this);
		} else {
			callbacks.oldOnComplete = callbacks.onComplete;
			callbacks.onComplete = function(result) { this.onDeleted(result); callbacks.oldOnComplete(result); }.bind(this);
		}
		this.getAdapter().Delete(this, callbacks);
	};

	/**
	 * override toString for easy detection of dbObjects
	 */
	this.toString = function () {
		return 'dbObject';
	};

	/** 
	 * Returns the actual className. Should be provided in the entity object.
	 * Might not look best, but saves a lot of hassle with reflection
	 */
	this.getType = function () {
		return(this.dbSetup.className);
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


//window.dbObjectAdapter = new dbObject.JSONAdapter('dbobject/proxy/');


/**
// should fail (TestProduct not defined):
dbObject.FindOne("TestProduct", { ID: 5 }, {});

// should work:
dbObject.Find(Product, { ID: 5, Catalog: { ID: 1 }}, {}, {
		function onSuccess(product) {
			console.debug("Oncomplete fired for dbObject.findONe!!", product);
			$$(".body")[0].adopt(product.display());
		},
		function onError(error) {

		}
});

// should also work, remote:
window.remoteAdapter = new dbObject.JSONAdapter('dbobject/proxy/');
var RemoteProduct = Product.extend({ dbSetup: { adapter: window.remoteAdapter }));
var RemoteCatalog = Catalog.extend({ dbSetup: { adapter: window.remoteAdapter }));

dbObject.Find(RemoteProduct, { ID: 5, RemoteCatalog: { ID: 1 }}, {}, {
		function onSuccess(product) {
			console.debug("Oncomplete fired for dbObject.findONe!!", product);
			$$(".body")[0].adopt(product.display());
		},
		function onError(error) {

		}
});


*/

