/**
 * The Query builder ported to JS :D
 */
CRUD.QueryBuilder = function(entity, filters, extras, justthese) {
	this.entity = entity instanceof CRUD.Entity ? entity.className : entity;
	this.filters = filters || {};
	this.extras = extras || [];
	justthese = justthese || [];
	this.wheres = []; this.joins = []; this.fields = []; this.orders = []; this.groups = [];
	this.limit = extras.limit ? 'LIMIT ' + extras.limit : 'LIMIT 0,100';
	this.parameters = []; // parameters to bind to sql query.

	var tableName = CRUD.EntityManager.entities[this.entity].table;
	justthese = justthese.length > 0 ? justthese : CRUD.EntityManager.entities[this.entity].fields;
	for(var i=0; i<justthese.length; i++) {
		this.fields.push(tableName+'.'+justthese[i]);
	}

	for(var prop in filters) {
		this.buildFilters(prop, filters[prop], this.entity);
	}	
	this.buildOrderBy();
};

CRUD.QueryBuilder.prototype = {
	buildFilters : function(what, value, _class) {
		var relatedClass = CRUD.EntityManager.hasRelation(_class, what);
		if(relatedClass) {  
			//console.warn("BuildFilters for sublcas! ", wtclass, value);
			for(var val in value) {
				this.buildFilters(val, value[val], relatedClass);
				this.buildJoins(relatedClass,_class);
			}
		}
		else if(typeof what == "Number") { // it's a custom sql where clause, just field=>value). unsafe because parameters are unbound, but very for custom queries.
			this.wheres.push(value);
		}
		else { // standard field=>value whereclause. Prefix with tablename for easy joins and push a value to the .
			if(what == 'ID') what = CRUD.EntityManager.getPrimary(_class);
			this.wheres.push(CRUD.EntityManager.entities[_class].table+'.'+what+' = ?');
			this.parameters.push(value);
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
		var entity = CRUD.EntityManager.entities[this.entity];
		if(entity.orderProperty && entity.orderDirection && this.orders.length === 0) {
			this.orders.push(entity.table+'.'+entity.orderProperty+" "+entity.orderDirection);
		}
	},

	buildJoins : function(theClass, parent) { // determine what joins to use
		if(!parent) return;	// nothing to join on, skip.
		var entity = CRUD.EntityManager[theClass];
		var parent = CRUD.EntityManager[parent];
		
		switch(parent.relations[entity.className]) { // then check the relationtype
			case CRUD.RELATION_SINGLE:
			case CRUD.RELATION_FOREIGN:
				if(entity.fields.indexOf(parent.primary) > -1) {
					this.addJoin(entity,parent);
				}
				else if(parent.fields.indexOf(entity.primary) > -1) {
					this.addJoin(parent,entity);
				}
			break;
			case CRUD.RELATION_MANY: // it's a many:many relation. Join the connector table and then the related one.
				connectorClass = parent.connectors[entity.className];
				conn = CRUD.EntityManager.entities[connectorClass];
				this.addJoin(conn, parent).addJoin(conn, entity);
				break;
			case CRUD.RELATION_CUSTOM:
				var rel = parent.relations[entity.className];
				this.joins = this.joins.unshift(['LEFT JOIN',entity.table,'ON',parent.table+'.'+rel.sourceProperty,'=',entity.table,'.',rel.targetProperty].join(' '));
			break;
			default:
				throw new Exception("Warning! class "+parent.className+" probably has no relation defined for class "+ entity.className+ "  or you did something terribly wrong..." + JSON.encode(parent.relations[_class]));
		}
	},

	addJoin: function(what, on) {
		this.joins.push(['LEFT JOIN',what.table,'ON',on.table+"."+on.primary,'=',what.table+'.'+what.primary].join(' '));
		return this;
	},

	buildQuery : function() {
		var where = this.wheres.length > 0 ? ' WHERE '+ this.wheres.join(" \n AND \n\t") : '';
		var order = (this.orders.length > 0) ? ' ORDER BY '+ this.orders.join(", ") : '' ;
		var group = (this.groups.length > 0) ? ' GROUP BY '+ this.groups.join(", ") : '' ;
		var query = 'SELECT '+this.fields.join(", \n\t")+"\n FROM \n\t"+CRUD.EntityManager.entities[this.entity].table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' '+this.limit;
		return({query: query, parameters: this.parameters});
	},

	getCount : function() {
		var where = (this.wheres.length > 0) ? ' WHERE '+this.wheres.join(" \n AND \n\t") : '';
		var order = '';
		var group = (this.groups.length> 0) ? ' GROUP BY '+this.groups.join(", ") : '' ;
		var query = "SELECT count(*) FROM \n\t"+CRUD.EntityManager.entities[this.entity].table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' ';
		return(query);
	}
}