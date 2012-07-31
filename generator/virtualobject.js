

 
var virtualObject = new Class({
	
	_{
		
				
						for (var field in  this.properties  )
						 {
	var info = this[field];
							output += "<tr><td>{this.ucProperties[field]}</td><td>"+
							initialize: function(database,table,properties)
									{
		this.database, table, properties, relations, foreignRelations, multiRelations, dbInfo, primaryKey, connectorTables,ucProperties, mandatory, relationproperties, propertymappings, graphViz, editortypes, validations, generator;
		this.this.table}_tabs";
		this.output= "
		<h3 class='tablename'>Table: {this.table}</h3>
		<div id='{id}'>
			<h2>General</h2>
			<div>
				<form method='post' action='./ajax/saveMappings/{this.database}/{this.table}/' onsubmit='$(this).send(); return false'>

					<table class='editor'>
					<tbody>
						<tr><th>Field</th><th>Property name</th></tr>
						<tr><td><strong class='primarykey'><u>{this.ucProperties[this.primaryKey]}</u></strong></td><td>ID</td></tr>";
		this.this.fieldEditor(field)+"</td></tr>";

		this.database = database;
		this.table = table;
		this.dbInfo = properties;
		this.relations = [];
		this.foreignRelations = [];
		this.multiRelations = [];
		this.ucProperties = [];
		this.mandatory = [];
		this.validator = [];
		this.propertymappings = [];
		this.relationproperties = [];
		this.generator = false;
		this.graphViz ='';
	},
	setupMappings: function()
 
	{

		for (var property in this.properties  )
		 {
	var info = this[property];
			this.propertymappings[property] = this.getMapping(property);
		}
	},
	addRelation: function(table)
												{

		this.relations[table] = '';
	},
	getPrimaryKey: function()
													{

		for (i=0; i<sizeof(this.dbInfo); i++)
		{
			lowercase = strtolower(this.dbInfo[i].Field);
			if (this.dbInfo[i].Key == 'PRI')
			{
				this.primaryKey = lowercase;	// we hebben em *O*
			}
			else
			{
				this.properties[lowercase] = this.dbInfo[i]; // het is een standaard property.
				
			}
			this.ucProperties[lowercase] = this.dbInfo[i].Field;
		}

		this.setupMappings();

		return(this.primaryKey);
	},
	hasProperty: function(prop)

	{

		return(is_array(this.properties) && array_key_exists(prop, this.properties));	
	},
	findForeignRelations: function(objects)
										{
	
		for (var table in  this.relations    )
		 {
	var type = this[table];
			if (!array_key_exists(this.table, objects[table].relations))	// foreign relations hebben een link naar $this, maar property $targettable->{$this->primarykey}
			{
				this.relations[table] = '1:1';								// $table->$field  zit 1:1 naar $this->ID, is dus 1:1 link
				objects[table].relations[this.table] = 'foreign';			// we laten de target tabel ook weten dat ie een relatie met deze tabel heeft.
			}
		}
	},
	findMultiRelations: function(objects)
										
	{

		for (var table in  this.relations    )
		 {
	var type = this[table];
			if (type == 'foreign')												// doorloop alle foreign relations van deze tabel
			{
				if (array_key_exists(this.table, objects[table].relations))	// en kijk of er een link terug voorkomt naar deze tabel
				{	
					tables = (array_keys(objects[table].relations, "1:1"));		// vind alle 1:1 relaties van deze tabel
					
					if (sizeof(tables) == 2)										// zijn dat er 2?
					{
						unsetme = implode("", array_keys(tables, this.table));	 // zo ja, unset $self
						delete tables[unsetme];

						tables = implode("", tables);
						this.multiRelations[tables] = table;					// en voeg $targettable toe :)
					}
				}
			}
		}
	},
	cleanup: function(objects)

	{

		//print_r($this->relations);
		for (var table in  this.relations    )
		 {
	var type = this[table];
			if (type == '1:1')												// doorloop alle foreign relations van deze tabel
			{
				this.relationproperties[objects[table].primaryKey] = this.ucProperties[objects[table].primaryKey];
				delete this.properties[objects[table].primaryKey];

				delete this.propertymappings[objects[table].primaryKey];

			}
		}
		for (var target in  this.multiRelations    )
		 {
	var connector = this[target];
			if (array_key_exists(connector, this.relations) && this.relations[connector] == 'foreign')	// doorloop alle foreign relations van deze tabel
			{
				delete this.relations[connector];
								// en pleur ze weg als ze koppeltabel zijn
			}
		}
		

	},
	display: function()

	{

		id = "{this.db}

});


						output += "<tr><td colspan='4' align='right'><input type='submit' value='Save changes'></tbody><tfoot></table>
				</form>
			</div>	
			<h2>Editor</h2>
			<div>
				<form method='post' action='./ajax/saveEditorTypes/{this.database}/{this.table}/' onsubmit='$(this).send(); return false'>
					<table class='editor'>
					<tbody>
					<tr><th>Field</th><th>Editor</th><th>Mandatory</th><th>Validation</th></tr>
					<tr>
					<td><strong><u>{this.ucProperties[this.primaryKey]}</u></strong></td>
					<td>Reserved</td><td>&nbsp;</td><td>&nbsp;</td></tr>";
			
					for (var field in  this.properties  )
					 {
	var info = this[field];
						output += "<tr><td>{this.ucProperties[field]}</td>";
						output += "<td>"+this.editorSelect(field)+"</td><td>"+this.getMandatory(field)+"</td><td>"+this.getValidation(field)+"</td></tr>";
					}
					output += "<tr><td colspan='4' align='right'><input type='submit' value='Save changes'></tbody><tfoot></table>
				</form>			
			</div>
			<h2>Relations</h2>
			<div><table class='editor'>
			<h3>All relations for this table</h3>	";
			if (!empty(this.relations))
			{
				output += "<tr><th colspan='4'>Relations:</th></tr>";

				for (var table in  this.relations  )
				 {
	var type = this[table];
					output += "<tr><td colspan='4'><a class='relation' href='#' onclick='chooseTable(\"{this.database}\", \"{table}\"); return false'>{table} <span class='small'>[{type}]</span></a> </td></tr>";
				}
			}
			
			if (!empty(this.multiRelations))
			{
				output += "<tr><th colspan='4'>Many To Many Relations:</th></tr><tr><th>To:</th><th colspan='3'>Via:</th></tr>";
				for (var tbl in  this.multiRelations  )
				 {
	var connectorTable = this[tbl];
					this.connectorTables[]= connectorTable;
					output += "<tr><td><a class='relation' href='#' onclick='chooseTable(\"{this.database}\", \"{tbl}\"); return false;'>{tbl}</a></td><td colspan='3'><a class='relation via' href='#' onclick='chooseTable(\"{this.database}\", \"{connectorTable}\"); return false'>{connectorTable}</a></td></tr>";
				}
			}
			output += "</table>
			</div>
			
		</div>
		
		</form>\r\n";
		
		return(output);
		
	}

	 function getMapping(field)
 
	{

		if(!array_key_exists(field, this.propertymappings))
		{
			val= classGenerator.prettyNotation(field);
			this.propertymappings[field] = val;
		}
		else
		{
			val = this.propertymappings[field];
		}
		return(val);
	}

	 function fieldEditor(field)

	{

		val = this.getMapping(field);
		return("<input type='text' name='{field}' value='{val}'>");
	}

	

	 function displayLI()

	{

		output = "<li><a href='#' onclick='chooseTable(\"{this.database}\", \"{this.table}\"); return false'>{this.table}</a></li>\r\n";
		return(output);
	}

	 function getEditorType(property)

	{

		origtype = (this.properties[strtolower(property)].Type);
					switch (substr(origtype,0,3))
					{
						case 'dat':
							type='dateEditor';
						break;
						case 'enm':
							type='enumSelect';
						break;
						case 'chr':
							type='BOOLEAN';
						break;
						case 'blb':
							type='fileInput';
						break;
						default:
							prop = explode("(", strtolower(origtype));
							prop = strtoupper(prop[0]);
							switch (prop)
							{
								case 'ENUM':
									type = 'enumSelect';
								break;
								case 'SET':
									type= 'setSelect';
								break;
								case 'DATE':
									type = 'dateEditor';
								break;
								case 'BLOB':
									type='fileInput';
								break;
								case 'TEXT':
								case 'MEDIUMTEXT':
								case 'LONGTEXT':
									type='fckInput';
								break;
								case 'DOUBLE':
									type = 'textInput';
								break;
								break;
								case 'CHAR':
									type = 'radioInput';
								break;
								case 'VARCHAR':
								default:
									type = 'textInput';
								break;
							}					
						break;
					}
		type = array_key_exists(property, this.editortypes) ? this.editortypes[property] : type;
		return(type);
	}

	 function editorSelect(property)
 
	{

		type = this.getEditorType(property);
		types = ["textInput", "checkboxInput", "radioInput", "fileInput", "enumSelect", "fckInput", "integerInput", "doubleInput", "dateEditor", "radioInput","enumSelect","setSelect"];
		for (var curtype in types  )
		 {
			selected = type == curtype ? " selected" : "";
			output += "<option value='{curtype}'{selected}>{curtype}</option>";
		}
		return("<select name='editortypes[property]'>{output}</select>");
	}

	 function getMandatory(field)
 
	{

		mandatory = array_key_exists(field, this.mandatory) ? this.mandatory[field] : false;
		checked = mandatory ? " checked" : "";
		return("<center><input type='checkbox' class='checkbox' name='mandatory[field]' value='1' {checked}></center>");
	}

	 function validatorSelect(property,type)
 
	{

		types = ['','date','email', 'amount', 'number', 'alfanum', 'words', 'phone', 'zipcode', 'plate', 'price', '2digitopt', '2digitforce', 'anything'];

		for (var curtype in types  )
		 {
			selected = type == curtype ? " selected" : "";
			output += "<option value='{curtype}'{selected}>{curtype}</option>";
		}
		return("<select name='validations[{property}]'>{output}</select>");
	}


	 function getValidation(field)

	{

		type = this.getEditorType(field);
		switch(type)
		{
			case 'dateEditor':
				validateType = 'date';
			break;
			case 'doubleInput':
				validatetype = '2digitforce';
			break;
			case 'integerInput':
				validatetype = 'number';
			break;
		}
		type = array_key_exists(field, this.validations) ? this.validations[field] : validateType;
		
		return(this.validatorSelect(field, type));		
		
	}

	 function displayGraphViz()
 
	{
var currentscheme = arguments.length >= 1 ? arguments[0] : 1;

		colorschemes = {
			0 : ['#efedf5','#dadaeb','#bcbddc'],
			1 : ['#f6e8c3', '#dfc27d','#bf812d'],
			2 : ['#fff7bc','#fee391','#fec44f']
			};


		items[]= this.primaryKey;
		for (var key in  this.properties  )
		 {
	var val = this[key];
			items[]= key;
		}
		for (var property in items  )
		 {
			color = (color== colorschemes[currentscheme][0]) ?colorschemes[currentscheme][1] : colorschemes[currentscheme][0];
			out += "<tr><td bgcolor='{color}' align='left'>{property}</td></tr>";
		}
		output = "<table cellpadding='0' cellspacing='0'><tr><td bgcolor='{colorschemes[currentscheme][2]}'><font point-size='11'>{this.table}</font></td></tr>{out}</table>";
		this.graphViz = "{this.table} [fontsize=9, fontname=helvetica, label=<{output}>];\r\n";
		return(this.graphViz);

	}


	 function createClass()

	{

		analyzer = databaseAnalyzer.getInstance(this.database);
		generator = new classGenerator(this);
		generator.feedValues(this);
		this.name = analyzer.getName(this.table);
		generator.name = this.name;
		
		generator.table = this.table;
		generator.dbInfo = this.dbInfo;
		generator.ucProperties = this.ucProperties;
		generator.relationproperties = this.relationproperties;
		generator.properties = this.propertymappings;	
		this.primaryKey = this.getPrimaryKey();
		generator.fields = generator.createConstructor();
		generator.primaryKey = this.ucProperties[this.primaryKey];
		generator.relations = generator.createRelations();
		generator.relationEditors = generator.createRelationEditors();
		generator.dbSchema = generator.createSchema();

		generator.editorProperties = generator.createEditor();
		
		tpl = new TemplateEngine('./templates/template.class.php');
		tpl.feedValues(generator.props);
		
	
		if(analyzer.generateoptions['displayeditor'] == true)
		{
			tpl.template =  './templates/function.displayeditor.php';
			tpl.validatorProperties = generator.createValidator();
			tpl.displayeditor = tpl.run();
		}
		if(analyzer.generateoptions['displayshort'] == true)
		{
			tpl.template = './templates/function.displayshort.php';
			tpl.displayshort = tpl.run();
		}
		if(analyzer.generateoptions['display'] == true)
		{
			tpl.template = './templates/function.display.php';
			tpl.display = tpl.run();
		}
		tpl.template = './templates/template.class.php';

		this.generator = generator;
		return(tpl.run());
	}

	 function createPlugin()
 
	{

		this.createClass();
		this.generator.primarykey = this.getPrimaryKey();
		this.generator.name = strtolower(this.name);
		
		return(this.generator.createPlugin());
	}





}

