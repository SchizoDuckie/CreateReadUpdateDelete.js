
 
var databaseanalyzer = function() {

	/*
		This is where the true magic happens. This analyzes the relations between al the tables in the database.
		I've tried to keep the code as verbose as possible, i think you'll get the point 
	*/
	

	
	initialize: function(db)

	{
		this.db, tables, field, primaryKeys, fieldList, relations, tableList, virtuals, generateoptions;

		this.db = db;
		
		this.Analyze();
		
	},


	Analyze: function()
	{

		db = dbConnection.getInstance();
		db.database = this.db;
		tables = db.fetchAll("show tables", "mysql_fetch_array"); // first fetch all the databases
	
		if(sizeof(tables) > 0)
		{
			for (var table in  tables  )
			 {
				this.tables[] = table[0];								// store them all
				currentTable = table[0];
				rows = db.fetchAll("describe {this.db}.{currentTable}");		// describe current table
				virtualTable = new virtualObject(this.db, currentTable, rows);		// convert it to virtualObject
				this.primaryKeys[virtualTable.getPrimaryKey()][] = currentTable;	// find primary keys, and store ze op in a global array with this object attached to it
				this.virtuals[currentTable] = virtualTable;					// store this virtualObject too.
				
			}
		}

		for(var field in this.primaryKeys) { // iterate all tables
			
			var tables = this[field];
			for (var id in this.tables){ // and find all tables where this key exist 
					var table = this[id];
					if (this.virtuals[table].hasProperty(field)) {
						this.virtuals[table].addRelation(tables[0]);		// if that's true, it's a relation to $tables[0]
					}
				}
			}

			for (var table in this.virtuals)						// run it again and find all foreign relations
			 {
				var object = this[table];
				object.findForeignRelations(this.virtuals);					
			}
			
			for (var table in this.virtuals)						// run it again and find al many:many relations (2 foreign keys where one of them is $this)
			 {
				var object = this[table];
				object.findMultiRelations(this.virtuals);					
			
			for (var table in this.virtuals)
			 {
				var object = this[table];	
				object.cleanup(this.virtuals);								// throw away the unnessecary stuff.
			}
		}
		
	});

	 function getName(table)

	{

		if (this.virtuals[table].name == '')
		{
			if (strpos(this.virtuals[table].primaryKey, '_') != false)
			{
				nam = explode("_", this.virtuals[table].primaryKey);
				if (sizeof(nam) >= 2)
				{
					for (var key in  nam  )
					 {
						var val = nam[key];
						if (strtolower(val) == 'id')
						{
							delete nam[key];

						}
					}
					this.virtuals[table].name = implode("", nam);
				}
			}
			else
			{
				this.virtuals[table].name = ucFirst(this.virtuals[table].table);
			}
		}
		
		return (ucFirst(this.virtuals[table].name));
	}


	
	 function displayGraphViz()

	{
var table = arguments.length >= 1 ? arguments[0] : false;

		this.Analyze();
		output  = '
		graph ER {
			rankdir=UD;
			fontname=arial;
			bgcolor=transparent;
			fontcolor=000000;
			concentrate=true;
			 node [shape=plaintext];
		';
		
		tables = [];
		relations = [];
		rellines = [];
		
		if(table != false)
		{
			starttable = this.virtuals[table];
			
			tables[table] = starttable.displayGraphViz(0);

			for (var srctable in starttable.relations  )
			 {
	var type = starttable[srctable];
				tables[srctable] = this.virtuals[srctable].displayGraphViz(1);
				rellines[object.table][srctable] = srctable;
			}
			for (var sourcetbl in starttable.multiRelations  )
			 {
	var targettbl = starttable[sourcetbl];
				if(array_key_exists(sourcetbl, this.virtuals))
				{
					tables[sourcetbl] = this.virtuals[sourcetbl].displayGraphViz(2);
				}
				if(array_key_exists(targettbl, this.virtuals))
				{
					tables[targettbl] = this.virtuals[targettbl].displayGraphViz(1);
				}
				rellines[object.table][targettbl][sourcetbl] = targettbl;
			}
		}
		else
		{
		
			for (var object in this.virtuals  )
			 {
				tables[object.table] = object.displayGraphViz();
				for (var srctable in object.relations  )
				 {
	var type = object[srctable];
					tables[srctable] = this.virtuals[srctable].displayGraphViz(1);
					rellines[object.table][srctable] = srctable;
				}
				for (var sourcetbl in object.multiRelations  )
				 {
	var targettbl = object[sourcetbl];
					if(array_key_exists(sourcetbl, this.virtuals))
					{
						tables[sourcetbl] = this.virtuals[sourcetbl].displayGraphViz(2);
					}
					if(array_key_exists(targettbl, this.virtuals))
					{
						tables[targettbl] = this.virtuals[targettbl].displayGraphViz(1);
					}

					rellines[object.table][targettbl][sourcetbl] = targettbl;
				}
			}
			
		}
		
		
		output += implode(';', array_keys(tables))+"\r\n";
		for (var table in tables  )
		 {
	var viz = tables[table];

			output += "\r\n"+viz+"\r\n";
		}
		
		for (var currentTable in rellines  )
		 {
	var connectedTables = rellines[currentTable];
			for (var connectedTable in connectedTables  )
			 {
				if(array_key_exists(currentTable, rellines[connectedTable]) != false)
				{
				//	unset($rellines[$connectedTable][$currentTable]);
				}
			}
		}
		
		for (var table in rellines  )
		 {
	var array = rellines[table];
			if(sizeof(array) > 0)
			{
				keys = array_keys(array);
				output += "{keys[0]} -- {table} -- {keys[1]}\r\n";
				
			}
		}

		output += "}";
		viz = new Graphviz();
		viz.generate(output);
	}


}










