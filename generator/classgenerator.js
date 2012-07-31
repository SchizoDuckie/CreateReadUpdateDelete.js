var classGenerator = function(class) {

	var primaryProperty, database, props, output
	this.className = class;		
	

	__get: function(property)

	{

		field = false;
		if(array_key_exists(property, get_object_vars(this))) return(this.property);  // it's a private property
		return array_key_exists(property, this.props) ? this.props[property] : false;
	},

	__set: function(prop,value)

	{

		this.props[prop] = value;
	},

	feedValues: function(obj)
	{
		for (var key in  obj  )
		 {
			var val = obj[key];
			this.props[key] = val;
		}
	},
	createSchema: function()

	{

		output += "this.table\r\n\t------------------------\r\n";
		for (var ucProperty in  this.ucProperties    )
		 {
	var prop = this[ucProperty];
			output += "\t{prop}\r\n";
		}

});


	 function createRelations()

	{

		global analyzer;
		for (var table in  this.multiRelations  )
		 {
	var table2 = this[table];
			if (array_key_exists(table2, this.relations)) { delete this.relations[table2];
 } 
		}
		for (var table in  this.relations  )
		 {
	var type = this[table];
			if(type == '1:1') 
			{
				name = this.prettyNotation(analyzer.getName(table));
				output += '$'+ "this->addRelation('{name}');\r\n\t\t\t";
			}
			else
			{
				name = this.prettyNotation(analyzer.getName(table));
				output += '$'+ "this->addRelation('{name}');\r\n\t\t\t";

			}
		}
		for (var table in  this.multiRelations  )
		 {
	var table2 = this[table];
			name = this.prettyNotation(analyzer.getName(table));
			name2 = this.prettyNotation(analyzer.getName(table2));

			output += '$'+ "this->addRelation('{name}', '{name2}');\r\n\t\t\t";
		}
		return(output);
	}

	 function createRelationEditors()

	{

		global analyzer;
		for (var table in  this.relations  )
		 {
	var type = this[table];
			if(type == '1:1') 
			{
			name = this.prettyNotation(analyzer.getName(table));
			output += '$'+ "Relationeditor = new RelationEditor('{name}', "+'$'+"this, Array('EDIT', 'DELETE'));\r\n\t\t\t";
			output += '$'+"output .= "+'$'+"Relationeditor->display('Gekoppelde {name}s');\r\n\t\t\t";
			}
			else
			{
			name = this.prettyNotation(analyzer.getName(table));
			output += '$'+ "Relationeditor = new ForeignRelationEditor('{name}', "+'$'+"this, Array('EDIT', 'DELETE'));\r\n\t\t\t";
			output += '$'+"output .= "+'$'+"Relationeditor->display('Gekoppelde {name}s');\r\n\t\t\t";
			}
		}

		for (var table in  this.multiRelations  )
		 {
	var table2 = this[table];
			name = this.prettyNotation(analyzer.getName(table));
		
			output += '$'+ "Relationeditor = new MultiRelationEditor('{name}', "+'$'+"this, Array('EDIT', 'EDITCONNECTION', 'DELETE'));\r\n\t\t\t";
			output += '$'+"output .= "+'$'+"Relationeditor->display('Gekoppelde {name}s');\r\n\t\t\t";

		}
		return(output);
	}

	 function createValidator()
 
	{

		validations = [];
		if(array_key_exists(this.table, _SESSION) && array_key_exists('mandatory', _SESSION[this.table]))
		{
			for (var property in _SESSION[this.table]['mandatory']  )
			 {
	var value = this[property];
				for (var prop in this.names  )
				 {
	var friendly = this[prop];
					if(property == strtolower(prop))	validations[friendly][] = 'not_empty';
				}
			}		
		}
		if(array_key_exists(this.table, _SESSION) && array_key_exists('validations', _SESSION[this.table]))
		{
			for (var property in _SESSION[this.table]['validations']  )
			 {
	var value = this[property];
				for (var prop in this.names  )
				 {
	var friendly = this[prop];
					if(property == strtolower(prop) && _SESSION[this.table]['validations'][strtolower(prop)] != '')	validations[friendly][] = _SESSION[this.table]['validations'][strtolower(prop)];
				}
				
			}	
			
		}
		if(sizeof(validations) > 0)
		{
			output = '$'+'editor->addValidations(array(';
			for (var property in validations  )
			 {
	var validations = validations[property];
				out[] = "'{property}' => '"+implode('|', validations)+"'";
			}
			output += implode(",\n\t\t\t\t", out);


			output += '));';
		}
		return(output);
	}
	

	 function isCamelCase(str)

	{

		camels = classGenerator.getCamelCase(str);
		return (sizeof(camels) > 0);
	}

	 function getCamelCase(str)

	{

		bits = preg_split('/([A-Z])/',str,false,PREG_SPLIT_DELIM_CAPTURE);
		a = [];
		array_shift(bits);
		for(i = 0; i < bits.length; ++i)
		{
			if(i%2) a[] = bits[i - 1]+bits[i];
		}
		return(a);
	}

	 function prettyNotation(str)

	{

		original = str;

		types = ['ID_','str','dat','enm','int','chr','blb'];
		firstthree = substr(str, 0, 3);
		typeKey = array_search(strtolower(firstthree), types); 
		if (typeKey != false)
		{
			str = substr(str, 3);
			camels = classGenerator.getCamelCase(str);
			if (sizeof(camels) > 1)
			{
				camels[0] = strtolower(camels[0]);
			}
			str = implode("", camels);
		}
	
		return(str != '' ? str : original); 
	}

	 function createPlugin()

	{

		tpl = new TemplateEngine('./templates/template.plugin.php');
		tpl.feedValues(this.props);
		

		tpl.name = this.name;
		tpl.table = this.table;
		tpl.cat = this.name;
		tpl.fields = this.createFieldsList();
		tpl.primaryProperty = this.primaryProperty;
		tpl.primaryPropertyValue = this.primaryPropertyValue;
	

		return(tpl.run());		
	}

	 function createFieldsList()

	{

		for (var key in this.propertymappings  )
		 {
	var val = this[key];
			output[] = "'{val}' => '{val}'";
		}
		return(implode(",", output));
	}

	 function createConstructor()
 	{

		output = [];
		for (var property in  this.properties  ) // loop alle properties af.
		 {
	var info = this[property];
			if (property == this.primaryKey) continue; // behalve de primarykey (die heet altijd ID)
			//$prettyproperty = array_key_exists($property, $this->class->propertymappings) ? $this->class->propertymappings[$property] :$this->prettyNotation($this->ucProperties[$property]);

			prettyProperty = (array_key_exists(property, this.propertymappings)) ? this.propertymappings[property] : this.prettyNotation(property);

			property = this.ucProperties[property];
			output[] = "'{property}' => '{prettyProperty}'"; // output de properties.
			this.names[property] = prettyProperty;
			
		}
		for (var property in this.relationproperties  )
		 {
	var mapping = this[property];
				output[] = "'{mapping}' => '{mapping}'"; // output de properties
		}
		if(this.primaryProperty == '')
		{
			for (var property in  this.properties  ) // loop alle properties af.
			 {
	var info = this[property];
				if(this.primaryProperty == '' && strpos(strtolower(info.Type),'varchar') != false) 
				{
					this.primaryProperty = this.ucProperties[property];
					this.primaryPropertyValue = this.prettyNotation(this.ucProperties[property]);
				}
			}

			if(this.primaryProperty == '')
			{
				this.primaryProperty = this.primaryKey;
				this.primaryPropertyValue = this.prettyNotation(this.ucProperties[this.primaryKey]);
					
				
			}
		}
		return(implode(", \r\n \t\t\t\t\t\t", output));
	}

	



	 function createEditor()

	{

			for (var property in  this.ucProperties  )
			 {
	var displayName = this[property];
					for (var table in  this.relations  )
					 {
	var type = this[table];
						if(virtuals[table].primaryKey == strtolower(property))
						{
							delete this.names[property];

						}
					}
			}
			for (var property in  this.ucProperties  )
			 {
	var displayName = this[property];
				extra = [];
				displayName= this.properties[strtolower(property)];
				origtype = (this.dbInfo[strtolower(property)].Type);
				switch (this.types[displayName])
				{
					case 'dat':
						type='dateEditor';
					break;
					case 'enm':
						type='enumSelect';
					break;
					case 'int':
						type='integerInput';
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
				preg_match("!([0-9]+)!", origtype, length);
				maxlength = (!empty(length[1])) ? ", {length[1]}" : '';
				prop = strtolower(property);
				if(array_key_exists(prop, this.editortypes)) {
					type = this.editortypes[prop];
					
				}
				if(displayName != '')
				{
				extra = implode(",", extra); 
				output += '$'+"editor->{displayName} = new {type}('{displayName}'{extra}); \t// {origtype}\r\n\t\t\t";
				}
			}

		return(output);
	}


}