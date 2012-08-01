var classGenerator = new Class({

	primaryProperty: false,
	database:false,
	props: {},
	output : '',
	className: false,
	
	initialize:function(class) {
		this.className = class;	
	},

	createSchema: function() {
		output += "this.table\r\n\t------------------------\r\n";
		for (var ucProperty in  this.ucProperties){
		var prop = this[ucProperty];
			output += "\t{prop}\r\n";
		}
	},

	  createRelations:function()	{
		//global analyzer;
		for (var table in  this.multiRelations) {
			var table2 = this[table];
			if (this.relations[table2]) {
				delete this.relations[table2];
			}
		}
		for (var table in  this.relations) {
			var type = this[table];
			var name;
			if(type == '1:1') {
				name = this.prettyNotation(analyzer.getName(table));
				output += '$'+ "this->addRelation('{name}');\r\n\t\t\t";
			}
			else {
				name = this.prettyNotation(analyzer.getName(table));
				output += '$'+ "this->addRelation('{name}');\r\n\t\t\t";
			}
		}
		for (var table in  this.multiRelations) {
			var table2 = this[table];
			name = this.prettyNotation(analyzer.getName(table));
			name2 = this.prettyNotation(analyzer.getName(table2));
			output += '$'+ "this->addRelation('{name}', '{name2}');\r\n\t\t\t";
		}
		return(output);
	},	

	 isCamelCase: function (str){
		var camels = this.getCamelCase(str);
		return (sizeof(camels) > 0);
	}

	 getCamelCase: function(str) {
		var bits = preg_split('/([A-Z])/',str,false,PREG_SPLIT_DELIM_CAPTURE);
		var a = [];
		array_shift(bits);
		for(i = 0; i < bits.length; ++i) {
			if(i%2) a[] = bits[i - 1]+bits[i];
		}
		return(a);
	}

	 createFieldsList: function()
	{

		for (var key in this.propertymappings  )
		 {
	var val = this[key];
			output[] = "'{val}' => '{val}'";
		}
		return(implode(",", output));
	}

	 createConstructor: function(){

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

}