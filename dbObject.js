const RELATION_SINGLE = 1;
const RELATION_FOREIGN = 2;
const RELATION_MANY = 3;
const RELATION_NOT_RECOGNIZED = 99;
const RELATION_NOT_ANALYZED = 0;
const RELATION_CUSTOM =6;


if (!dbObject) var dbObject = {};

/**
 * dbObject.Find is probably the funciton that you'll use most to query things:
 * 
 * Syntax:
 * dbObject.Find(Product, { Catalog: { ID: 1 }}, {
 *			onSuccess: function(products) {
 *				for(var i=0; i< products.length; i++) {
 *					$$(".body")[0].adopt(products[i].display());	
 *				}
 *			},
 *			onError: function(error) {
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

	if(obj.getID() != false) {
		filters = {
			ID : obj.getID(),
			type : filters 
		};	
	}
	var extras = {} ;
	if(options.limit) {
		extras.limit = (options.start || 0) + "," + options.limit;
		delete options.limit;
		delete options.start;
	}
	var justthese = [];
	
	obj.getAdapter().Find(obj.getType(), filters, extras, justthese, options);	
};
			
dbObject.FindOne = function(obj, filters, options) {
	options.limit = 1;
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

dbObject.ConnectionAdapter = new Class({
	Implements: [Options, Events],
	endpoint: false,
		
	initialize: function(endpoint, options) {
		this.endpoint = endpoint;
		this.setOptions(options);
	},

	filterOptions: function(options) {
		this.success = options.onSuccess || function(a,b) { console.log("Unhandled result! Missing onSuccess?", a,b) };
		this.error = options.onError || function(a,b) { console.info("Error!", a,b) };
		
		delete options.onSuccess;
		delete options.onError;
		return options;
	}
});


dbObject.Entity = new Class({
	Implements: [Options, Events],

	toString: function() {
		return 'dbObject';
	},

	getType: function() {
		return(this.dbSetup.className);
	},

	dbSetup: {
		className: 'dbObject.Entity',
		table: false,
		primary: false,
		fields: [],
		ID: false,
		adapter: 'dbAdapter',
		orderProperty: false,
		orderDirection: false
	},

	databaseValues: {},
	changedValues: {},
	relations: {},
	_customProperties: [], // custom properties to send along to the adapter (handy for form saves)
	customData: {},
	initialize: function(ID) {
			
	},

	__setupDatabase: function(ID, dbSetup) {
		this.dbSetup.ID = ID || false;
		if(this.dbSetup.ID != false) {
		   this.Find({"ID" : ID});
		}
	},

	getID: function() {
		return this.dbSetup.ID;
	},

	getAdapter: function() {
		var adapter = typeof this.dbSetup.adapter == "string" ? window[this.dbSetup.adapter] : this.dbSetup.adapter;
		if(!adapter) throw("[dbObject] Exception in getAdapter, cannot find an instance of "+this.dbSetup.adapter+" for entity "+this.dbSetup.className);
		return adapter;
	},

	/** 
	 * Get al list of all the values to display.
	 */ 
	getValues: function() {
		var v = this.databaseValues;
		if(this.changedValues && Array.from(this.changedValues).length > 0) { 
			for(var k in this.changedValues) {
				v[k] = this.changedValues[k];
			}
		}
		v.ID = this.getID();
		return v;
	},

	hasField: function(fieldname) {
		return(this.dbSetup.fields.indexOf(fieldname) > -1);
	},

	importValues: function(values) {
		var fields = this.dbSetup.fields, pri = this.dbSetup.primary;
		for(var i= 0; i < fields.length; i++) {
			var field = fields[i];
			this.databaseValues[field] = values[field]
			if (field == pri) this.dbSetup.ID = values[field];
		}
		return this;
	},	

	get: function(field, def) {
		if(this.changedValues[field]) { return this.changedValues[field] }
		if(this.databaseValues[field]) { return this.databaseValues[field] }
		if(!this.hasField(field)) {
			console.error("Could not find field '"+field+ "' in '"+ this.getType()+"' for getting.");
		} else {
			return def || '';
		}
	},

	set: function(field, value) {
		if(this.hasField(field)) {
			if(this.get(field) != value) this.changedValues[field] = value;
		} else if (this._customProperties.indexOf(field) > -1) {
				this.customData[field] = value;
		}else {
			console.error("Could not find field '"+field+"' in '"+ this.getType()+"' for setting.");
		}
	},

	Save: function(event, callbacks) {
		if(!callbacks.onComplete) {
			callbacks.onComplete = this.onSaved.bind(this);
		} else {
			callbacks.oldOnComplete = callbacks.onComplete;
			callbacks.onComplete = function(result) { this.onSaved(result); callbacks.oldOnComplete(result) }.bind(this);
		}
		if($H(this.changedValues).getLength() > 0 || $H(this.customData).getLength() > 0) {
			var newID = this.getAdapter().Save(this, callbacks);
		}
	},

	registerProperty: function(name) {
		this.__customProperties.push(name);
	},

	onSaved: function(result) {
		if(result.Action == 'inserted' && this.getID() == false) {
			this.databaseValues = result.Result[0];
			this.changedValues = Array();
			this.dbSetup.ID = this.databaseValues[this.dbSetup.primary];
		}
		else if (result.Action == 'saved' && this.getID() != false) {
			this.databaseValues = result.Result[0];
			this.changedValues = Array();
		} else if (result.Action == 'updated') {
			this.changedValues = Array();
			for( var i in this.dbSetup.fields) {
				var field = this.dbSetup.fields[i];
				if(result.Result[0][field]) this.databaseValues[field] = result.Result[0][field]
			}
		}
		this.fireEvent('saved', {target: result });
		console.warn(this.getType()+" has been saved. Result: " + result.Action + ". New Values: "+JSON.encode(this.databaseValues));
		//alert('dbObject has been saved! ', result);
	},

	onDeleted: function(result) {
		this.fireEvent('deleted', result);
		if(result.Action == 'deleted') {
			this.dbSetup.ID = false;
			this.changedValues = Array();
			this.databaseValues = Array();
		}
		console.warn(this.getType()+" has been deleted! ");
	},

	deleteYourself: function(callbacks) {
		if(!callbacks) callbacks = {};
		if(!callbacks.onComplete) {
			callbacks.onComplete = this.onDeleted.bind(this);
		} else {
			callbacks.oldOnComplete = callbacks.onComplete;
			callbacks.onComplete = function(result) { this.onDeleted(result); callbacks.oldOnComplete(result) }.bind(this);
		}
		this.getAdapter().Delete(this, callbacks);
	},

	// mte compatibility.
	isObservable: true,
    bindings: new Events(),

    listenChange: function (property, eventHandler, initTrigger) {
        if (initTrigger) {
            eventHandler(this, property, this.get(property));
        }
        this.bindings.addEvent(property, eventHandler);
    },

    triggerChange: function (property, value) {
        this.bindings.fireEvent(property, [this, property, value]);
    }
});


// adapted from Mte, implements getters/setters.
Class.Mutators.dbSetup = function (configuration) {

    var setFunction = function (item) {
        return function (value) {
            this.set(item, value);
            this.triggerChange(item, value);
        };
    };

    var getFunction = function (item) {
        return function () { return this.get(item) }
    };

    configuration.fields.each(function (item) {
        var getName = ('get' + item.capitalize());
        var setName = ('set' + item.capitalize());
        this.implement({
			getName : getFunction(item),
			setName : setFunction(item)
		});
    }, this);
	return configuration;
};



//window.dbObjectAdapter = new dbObject.JSONAdapter('dbobject/proxy/');


/* 
// should fail (TestProduct not defined):
dbObject.FindOne("TestProduct", { ID: 5 }, {});

// should work:
dbObject.Find(Product, { ID: 5, Catalog: { ID: 1 }}, {}, {
		onSuccess: function(product) {
			console.debug("Oncomplete fired for dbObject.findONe!!", product);
			$$(".body")[0].adopt(product.display());	
		},
		onError: function(error) {

		}
});

// should also work, remote:
window.remoteAdapter = new dbObject.JSONAdapter('dbobject/proxy/');
var RemoteProduct = Product.extend({ dbSetup: { adapter: window.remoteAdapter }));
var RemoteCatalog = Catalog.extend({ dbSetup: { adapter: window.remoteAdapter }));

dbObject.Find(RemoteProduct, { ID: 5, RemoteCatalog: { ID: 1 }}, {}, {
		onSuccess: function(product) {
			console.debug("Oncomplete fired for dbObject.findONe!!", product);
			$$(".body")[0].adopt(product.display());	
		},
		onError: function(error) {

		}
});


*/		



