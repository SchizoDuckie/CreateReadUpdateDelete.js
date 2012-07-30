/**
 * The Query builder ported to JS :D
 */
CRUD.QueryBuilder = function(className, filters, extras, justthese) {
	this.origin = className;
	this.filters = filters || {};
	this.extras = extras || [];
	justthese = justthese || [];
	this.wheres = this.joins = this.fields = this.orders = this.groups = [];
	this.limit = extras.limit ? 'LIMIT ' + extras.limit : 'LIMIT 0,100';
	
	if(typeof(this.origin) === "string") {
		this.origin = new window[className]();
	}

	var tableName = this.origin.dbSetup.table;
	justthese = justthese || this.origin.dbSetup.fields;
	for(var i=0; i<justthese.length; i++) {
		this.fields.push(tableName+'.'+justthese[i]);
	}

	for(var prop in filters) {
		this.buildFilters(prop, filters[prop], this.origin);
	}
	this.buildOrderBy();
}

CRUD.QueryBuilder.prototype = {
	
	buildFilters : function(what, value, _class) {
		var wtclass = _class.dbSetup.relations[what] ? new window[what]() : false;
		if(wtclass) {  // filter by a property of a subclass
			//console.warn("BuildFilters for sublcas! ", wtclass, value);
			for(var val in value) {
				this.buildFilters(val,value[val], wtclass);
				this.buildJoins(wtclass,_class);
			}
		}
		else if(typeof what == "Number") { // it's a custom whereclause (not just field=>value)
			if((!_class.dbSetup)) _class = new _class();
			value = value.replace('"', '\"');
			value = value.replace("'", "\'");
			this.wheres.push(value);
		}
		else { // standard field=>value whereclause. Prefix with tablename for speed.
			if(_class.toString() !== "CRUD") _class = new _class();
			if(what == 'ID') what = _class.dbSetup.primary;
			this.wheres.push(_class.dbSetup.table+'.'+what+" = '"+value+"'");
		}
	},

	buildOrderBy : function()	// filter the 'extras' parameter for order by, group by and limit clauses.
	{
		hasorderby = false;
		if(this.extras.length === 0) return;
		if(this.extras.limit) {
			this.limit = "LIMIT "+this.extras.limit;
			delete this.extras.limit;
		}
		for(var key in this.extras) {
			var extra = this.extra[key].toUpperCase();
			if(extra.indexOf('ORDER BY') > -1) {
				this.orders.push(extra.replace('ORDER BY', ''));
				delete this.extras[key];
			}
			if(extra.indexOf('GROUP BY') > -1) {
				this.groups.push(extra.replace('GROUP BY', ''));
				delete this.extras[key];
			}
		}
		if(this.origin.dbSetup.orderProperty && this.origin.dbSetup.orderDirection && this.orders.length === 0) {
			this.orders.push(this.origin.dbSetup.orderProperty+" "+this.origin.dbSetup.orderDirection);
		}
	},

	buildJoins : function(theClass, parent) { // determine what joins to use
		if(!parent) return;	// nothing to join on, skip.
		if(!(theClass.dbSetup)) theClass = new theClass();
		if(!(parent.dbSetup)) parent = new parent();
		var _class = theClass.getType();
		var theTable = theClass.dbSetup.table;
		var thePrimary = theClass.dbSetup.primary;
		var parentTable = parent.dbSetup.table;
		var parentPrimary = parent.dbSetup.primary;

		switch(parent.dbSetup.relations[_class]) { // then check the relationtype
			case CRUD.RELATION_SINGLE:
			case CRUD.RELATION_FOREIGN:
				if(theClass.dbSetup.fields.indexOf(parentPrimary) > -1) {
					this.joins.push("LEFT JOIN \n\t "+theTable+ " on "+ parentTable+ "."+ parentPrimary+" = "+theTable+ "."+ parentPrimary);
				}
				else if(parent.dbSetup.fields.indexOf(thePrimary) > -1) {
					this.joins.push("LEFT JOIN \n\t "+theTable+ " on "+theTable+ "."+thePrimary+ " = "+ parentTable+ "."+thePrimary+ "");
				}
			break;
			case CRUD.RELATION_MANY: // it's a many:many relation. Join the connector table and then the other one.
				connectorClass = parent.dbSetup.connectors[_class];
				conn = new window[connectorClass](false);
				this.joins.push("LEFT JOIN \n\t "+ conn.dbSetup.table+ " on  "+ conn.dbSetup.table+ "."+ parentPrimary+ " = "+ parentTable+ "."+ parentPrimary+ "");
				this.joins.push("LEFT JOIN \n\t "+theTable+ " on "+ conn.dbSetup.table+ "."+thePrimary+ " = "+theTable+ "."+thePrimary+ "");
			break;
			case CRUD.RELATION_CUSTOM:
				var rel = parent.dbSetup.relations[_class];
				this.joins = this.joins.unshift("LEFT JOIN \n\t "+theTable+ " on "+ parentTable+ "."+ rel.sourceProperty+ " = "+theTable+ "."+ rel.targetProperty+ "");
				this.joins.push("LEFT JOIN \n\t "+theTable+ " on "+ parentTable+ "."+ rel.sourceProperty+ " = "+theTable+ "."+ rel.targetProperty+ "");
			break;
			default:
				throw new Exception("Warning! class "+parent.dbSetup.className+" probably has no relation defined for class "+ _class+ "  or you did something terribly wrong..." + JSON.encode(parent.dbSetup.relations[_class]));
		}
	},

	buildQuery : function() {
		var where = this.wheres.length > 0 ? ' WHERE '+ this.wheres.join(" \n AND \n\t") : '';
		var order = (this.orders.length > 0) ? ' ORDER BY '+ this.orders.join(", ") : '' ;
		var group = (this.groups.length > 0) ? ' GROUP BY '+ this.groups.join(", ") : '' ;
		var query = 'SELECT '+this.fields.join(", \n\t")+"\n FROM \n\t"+this.origin.dbSetup.table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' '+this.limit;
		return(query);
	},

	getCount : function() {
		var where = (this.wheres.length > 0) ? ' WHERE '+this.wheres.join(" \n AND \n\t") : '';
		var order = '';
		var group = (this.groups.length> 0) ? ' GROUP BY '+this.groups.join(", ") : '' ;
		var query = "SELECT count(*) FROM \n\t"+this.origin.dbSetup.table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' ';
		return(query);
	}
};