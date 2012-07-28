/**
 * The Query builder ported to JS :D
 */
dbObject.QueryBuilder = function(className, filters, extras, justthese) {

	/**
	 * QueryBuilder::initialize()
	 * 
	 * @param mixed class
	 * @param mixed filters
	 * @param mixed extras
	 * @param mixed justthese
	 * @return
	 */
	this.origin = className;
	this.filters = filters || {};
	this.extras = extras || [];
	justthese = justthese || [];
	this.wheres = [];
	this.joins = [];
	this.fields = [];
	this.orders = [];
	this.groups = [];
	this.limit = extras.limit ? 'LIMIT ' + extras.limit : 'LIMIT 0,100';
	
	if(typeof(this.origin) === "string") {
		this.origin = new window[className]();
	}

	var tableName = this.origin.dbSetup.table;
	if(justthese.length === 0) justthese = this.origin.dbSetup.fields;
	for(var i=0; i<justthese.length; i++) {
		this.fields.push(tableName+'.'+justthese[i]);
	}

	//console.warn("Querybuilder intialized!", filters, extras, justthese, this.origin);
	for(var property in filters) {
		//console.log("build filters for ", property, filters[property]);
		this.buildFilters(property, filters[property], this.origin);
	}

	this.buildOrderBy();
}

/**
 * QueryBuilder::buildFilters()
 * This is the tricky part. You can mix both sql wheres as key/values and you can also use a dbObject class as an array key, then it will auto-join that table.
 * Syntax then works like this:
 * 
 * <pre>
 * input = dbObject.Search('SkillGroupFlowRelation', 
 *			Array('FlowRouting' =>
 *				Array("MainTimeframeRelation" => 
 *					Array("MainRouting"=> 
 *						Array("SrnMainRelation" => 
 *							Array("Srn" => Array("ID"=>this.srn.ID)))))));
 * </pre>
 * This finds a SkillGroupFlowRelation connected to a FlowRouting, which is chained down until an Srn Object with id this.srn.ID.
 * It automatically generates this query:
 *
 * <pre>
 *	SELECT skillgroup_flow_relation.sf_id, 
 *		skillgroup_flow_relation.sf_modified, 
 *		skillgroup_flow_relation.sf_created, 
 *		skillgroup_flow_relation.sf_flow_id, 
 *		skillgroup_flow_relation.sf_queue_id, 
 *		skillgroup_flow_relation.sf_order_pos, 
 *		skillgroup_flow_relation.sf_description, 
 *		skillgroup_flow_relation.sf_max_tries, 
 *		skillgroup_flow_relation.sf_max_ringtime, 
 *		skillgroup_flow_relation.sf_prompt_wait_start, 
 *		skillgroup_flow_relation.sf_prompt_wait_between, 
 *		skillgroup_flow_relation.sf_prompt_silence, 
 *		skillgroup_flow_relation.sf_target_type, 
 *		skillgroup_flow_relation.sf_target_id
 *	 FROM 
 *		skillgroup_flow_relation
 *	 LEFT JOIN 
 *		 flow_routing on skillgroup_flow_relation.sf_flow_id = flow_routing.fr_id
 *	 LEFT JOIN 
 *		 main_timeframe_relation on flow_routing.fr_id = main_timeframe_relation.mtr_flow_id
 *	 LEFT JOIN 
 *		 main_routing on main_timeframe_relation.mtr_mr_id = main_routing.mr_id
 *	 LEFT JOIN 
 *		 srn_main_relation on main_routing.mr_id = srn_main_relation.smr_mr_id
 *	 LEFT JOIN 
 *		 srn on srn_main_relation.smr_srn_id = srn.id WHERE srn.id = '134' 
 *
 * </pre>
 *
 * @param mixed what what to find: a class or a field in an class
 * @param string value the value that the searchfield needs to have
 * @param mixed class the class to find the property in
 */

dbObject.QueryBuilder.prototype.buildFilters = function(what, value, _class)
{
	var wtclass = _class.dbSetup.relations[what] ? new window[what]() : false;
	//console.info("BuildFilters: ", what, value, wtclass, _class.relations);
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
		this.wheres.push(this.mapFields(value, _class));
	}
	else { // standard field=>value whereclause. Prefix with tablename for speed.
		if(!_class.toString() == "dbObject") _class = new _class();
		//value = value.replace('"', '\"');
		//value = value.replace("'", "\'");
		if(what == 'ID') what = _class.dbSetup.primary;
		this.wheres.push(_class.dbSetup.table+'.'+what+" = '"+value+"'");
	}
};

/**
 * QueryBuilder::buildOrderBy()
 *
 * @return
 */
dbObject.QueryBuilder.prototype.buildOrderBy = function()	// filter the 'extras' paramter for order by, group by and limit clauses.
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
			this.orders.push(this.mapFields(extra.replace('ORDER BY', ''), this.origin));
			delete this.extras[key];
		}
		
		if(extra.indexOf('GROUP BY') > -1) {
			this.groups.push(this.mapFields(extra.replace('GROUP BY', ''), this.origin));
			delete this.extras[key];
		}
	}
	if(this.origin.dbSetup.orderProperty && this.origin.dbSetup.orderDirection && this.orders.length === 0) {
		this.orders.push(this.mapFields(this.origin.dbSetup.orderProperty+" ", this.origin)+"."+this.origin.dbSetup.orderDirection);
	}
	//console.warn("built orderby", this.orders);
};

/**
 * QueryBuilder::mapFields()
 *
 * @param mixed query
 * @param mixed object
 * @return
 */
dbObject.QueryBuilder.prototype.mapFields = function(query, object) { // map the 'pretty' fieldnames to db table fieldnames.
	return(query);
};

/**
 * QueryBuilder::buildJoins()
 *
 * @param mixed class
 * @param bool parent
 * @return
 */
dbObject.QueryBuilder.prototype.buildJoins = function(theClass, parent) { // determine what joins to use
	if(!parent) return;	// nothing to join on, skip.
	if(!(theClass.dbSetup)) theClass = new theClass();
	var _class = theClass.getType();
	if(!(parent.dbSetup)) parent = new parent();
	
	switch(parent.dbSetup.relations[_class]) { // then check the relationtype
		case dbObject.RELATION_SINGLE:
		case dbObject.RELATION_FOREIGN:	
			if(theClass.dbSetup.fields.indexOf(parent.dbSetup.primary) > -1) {
				this.joins.push("LEFT JOIN \n\t "+theClass.dbSetup.table+ " on "+ parent.dbSetup.table+ "."+ parent.dbSetup.primary+" = "+theClass.dbSetup.table+ "."+ parent.dbSetup.primary);
			}
			else if(parent.dbSetup.fields.indexOf(theClass.dbSetup.primary) > -1) {
				this.joins.push("LEFT JOIN \n\t "+theClass.dbSetup.table+ " on "+theClass.dbSetup.table+ "."+theClass.dbSetup.primary+ " = "+ parent.dbSetup.table+ "."+theClass.dbSetup.primary+ "");
			}
		break;
		case dbObject.RELATION_MANY:									// it's a many:many relation. Join the connector table and then the other one.
			connectorClass = parent.dbSetup.connectors[_class];
			conn = new window[connectorClass](false);
			this.joins.push("LEFT JOIN \n\t "+ conn.dbSetup.table+ " on  "+ conn.dbSetup.table+ "."+ parent.dbSetup.primary+ " = "+ parent.dbSetup.table+ "."+ parent.dbSetup.primary+ "");
			this.joins.push("LEFT JOIN \n\t "+theClass.dbSetup.table+ " on "+ conn.dbSetup.table+ "."+theClass.dbSetup.primary+ " = "+theClass.dbSetup.table+ "."+theClass.dbSetup.primary+ "");
		break;
		case dbObject.RELATION_CUSTOM:
			this.joins = this.joins.unshift("LEFT JOIN \n\t "+theClass.dbSetup.table+ " on "+ parent.dbSetup.table+ "."+ parent.dbSetup.relations[_class].sourceProperty+ " = "+theClass.dbSetup.table+ "."+ parent.dbSetup.relations[_class].targetProperty+ "");
			this.joins.push("LEFT JOIN \n\t "+theClass.dbSetup.table+ " on "+ parent.dbSetup.table+ "."+ parent.dbSetup.relations[_class].sourceProperty+ " = "+theClass.dbSetup.table+ "."+ parent.dbSetup.relations[_class].targetProperty+ "");
		break;
		default:
			throw new Exception("Warning! class "+parent.dbSetup.className+" probably has no relation defined for class "+ _class+ "  or you did something terribly wrong..." + JSON.encode(parent.dbSetup.relations[_class]));
		break;
	}
	//this.joins = array_unique(this.joins);
};

/**
 * QueryBuilder::buildQuery()
 *
 * @return
 */
 dbObject.QueryBuilder.prototype.buildQuery = function() { // joins all the previous stuff together.
	var where = this.wheres.length > 0 ? ' WHERE '+ this.wheres.join(" \n AND \n\t") : '';
	var order = (this.orders.length > 0) ? ' ORDER BY '+ this.orders.join(", ") : '' ;
	var group = (this.groups.length > 0) ? ' GROUP BY '+ this.groups.join(", ") : '' ;
	var query = 'SELECT '+this.fields.join(", \n\t")+"\n FROM \n\t"+this.origin.dbSetup.table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' '+this.limit;
	return(query);
};

/**
 * QueryBuilder::getCount()
 *
 * @return
 */
dbObject.QueryBuilder.prototype.getCount = function() {
	var where = (this.wheres.length > 0) ? ' WHERE '+this.wheres.join(" \n AND \n\t") : '';
	var order = '';
	var group = (this.groups.length> 0) ? ' GROUP BY '+this.groups.join(", ") : '' ;
	var query = "SELECT count(*) FROM \n\t"+this.origin.dbSetup.table+"\n "+this.joins.join("\n ")+where+' '+group+' '+order+' ';
	return(query);
};