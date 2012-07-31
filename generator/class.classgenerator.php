<?php

class classGenerator
{
	var $primaryProperty, $database, $props;
	function __construct($class) {
		$this->className = $class;		
	}
	
	function __get($property)
	{
		$field = false;
		if(array_key_exists($property, get_object_vars($this))) return($this->$property);  // it's a private property
		return array_key_exists($property, $this->props) ? $this->props[$property] : false;
	}

	function __set($prop, $value)
	{
		$this->props[$prop] = $value;
	}

	function feedValues($obj)
	{
		foreach ($obj as $key=>$val)
		{
			$this->props[$key] = $val;
		}
	}


	function createSchema()
	{
		$output .= "$this->table\r\n\t------------------------\r\n";
		foreach ($this->ucProperties as $ucProperty => $prop)
		{
			$output .= "\t{$prop}\r\n";
		}
		return ($output);
	}
	function createRelations()
	{
		global $analyzer;
		foreach ($this->multiRelations as $table=>$table2)
		{
			if (array_key_exists($table2, $this->relations)) { unset($this->relations[$table2]); } 
		}
		foreach ($this->relations as $table=>$type)
		{
			if($type == '1:1') 
			{
				$name = $this->prettyNotation($analyzer->getName($table));
				$output .= '$'. "this->addRelation('{$name}');\r\n\t\t\t";
			}
			else
			{
				$name = $this->prettyNotation($analyzer->getName($table));
				$output .= '$'. "this->addRelation('{$name}');\r\n\t\t\t";

			}
		}
		foreach ($this->multiRelations as $table=>$table2)
		{
			$name = $this->prettyNotation($analyzer->getName($table));
			$name2 = $this->prettyNotation($analyzer->getName($table2));

			$output .= '$'. "this->addRelation('{$name}', '{$name2}');\r\n\t\t\t";
		}
		return($output);
	}

	function createRelationEditors()
	{
		global $analyzer;
		foreach ($this->relations as $table=>$type)
		{
			if($type == '1:1') 
			{
			$name = $this->prettyNotation($analyzer->getName($table));
			$output .= '$'. "Relationeditor = new RelationEditor('{$name}', ".'$'."this, Array('EDIT', 'DELETE'));\r\n\t\t\t";
			$output .= '$'."output .= ".'$'."Relationeditor->display('Gekoppelde {$name}s');\r\n\t\t\t";
			}
			else
			{
			$name = $this->prettyNotation($analyzer->getName($table));
			$output .= '$'. "Relationeditor = new ForeignRelationEditor('{$name}', ".'$'."this, Array('EDIT', 'DELETE'));\r\n\t\t\t";
			$output .= '$'."output .= ".'$'."Relationeditor->display('Gekoppelde {$name}s');\r\n\t\t\t";
			}
		}

		foreach ($this->multiRelations as $table=>$table2)
		{
			$name = $this->prettyNotation($analyzer->getName($table));
		
			$output .= '$'. "Relationeditor = new MultiRelationEditor('{$name}', ".'$'."this, Array('EDIT', 'EDITCONNECTION', 'DELETE'));\r\n\t\t\t";
			$output .= '$'."output .= ".'$'."Relationeditor->display('Gekoppelde {$name}s');\r\n\t\t\t";

		}
		return($output);
	}

	function createValidator() 
	{
		$validations = array();
		if(array_key_exists($this->table, $_SESSION) && array_key_exists('mandatory', $_SESSION[$this->table]))
		{
			foreach($_SESSION[$this->table]['mandatory'] as $property=>$value)
			{
				foreach($this->names as $prop=>$friendly)
				{
					if($property == strtolower($prop))	$validations[$friendly][] = 'not_empty';
				}
			}		
		}
		if(array_key_exists($this->table, $_SESSION) && array_key_exists('validations', $_SESSION[$this->table]))
		{
			foreach($_SESSION[$this->table]['validations'] as $property=>$value)
			{
				foreach($this->names as $prop=>$friendly)
				{
					if($property == strtolower($prop) && $_SESSION[$this->table]['validations'][strtolower($prop)] != '')	$validations[$friendly][] = $_SESSION[$this->table]['validations'][strtolower($prop)];
				}
				
			}	
			
		}
		if(sizeof($validations) > 0)
		{
			$output = '$'.'editor->addValidations(array(';
			foreach($validations as $property=>$validations)
			{
				$out[] = "'{$property}' => '".implode('|', $validations)."'";
			}
			$output .= implode(",\n\t\t\t\t", $out);


			$output .= '));';
		}
		return($output);
	}
	

	function isCamelCase($str)
	{
		$camels = classGenerator::getCamelCase($str);
		return (sizeof($camels) > 0);
	}

	function getCamelCase($str)
	{
		$bits = preg_split('/([A-Z])/',$str,false,PREG_SPLIT_DELIM_CAPTURE);
		$a = array();
		array_shift($bits);
		for($i = 0; $i < count($bits); ++$i)
		{
			if($i%2) $a[] = $bits[$i - 1].$bits[$i];
		}
		return($a);
	}

	function prettyNotation($str)
	{
		$original = $str;

		$types = array('ID_','str','dat','enm','int','chr','blb');
		$firstthree = substr($str, 0, 3);
		$typeKey = array_search(strtolower($firstthree), $types); 
		if ($typeKey !== false)
		{
			$str = substr($str, 3);
			$camels = classGenerator::getCamelCase($str);
			if (sizeof($camels) > 1)
			{
				$camels[0] = strtolower($camels[0]);
			}
			$str = implode("", $camels);
		}
	
		return($str != '' ? $str : $original); 
	}

	function createPlugin()
	{
		$tpl = new TemplateEngine('./templates/template.plugin.php');
		$tpl->feedValues($this->props);
		

		$tpl->name = $this->name;
		$tpl->table = $this->table;
		$tpl->cat = $this->name;
		$tpl->fields = $this->createFieldsList();
		$tpl->primaryProperty = $this->primaryProperty;
		$tpl->primaryPropertyValue = $this->primaryPropertyValue;
	

		return($tpl->run());		
	}

	function createFieldsList()
	{
		foreach($this->propertymappings as $key=>$val)
		{
			$output[] = "'{$val}' => '{$val}'";
		}
		return(implode(",", $output));
	}

	function createConstructor() // maak de constructor aan
	{
		$output = array();
		foreach ($this->properties as $property=>$info) // loop alle properties af.
		{
			if ($property == $this->primaryKey) continue; // behalve de primarykey (die heet altijd ID)
			//$prettyproperty = array_key_exists($property, $this->class->propertymappings) ? $this->class->propertymappings[$property] :$this->prettyNotation($this->ucProperties[$property]);

			$prettyProperty = (array_key_exists($property, $this->propertymappings)) ? $this->propertymappings[$property] : $this->prettyNotation($property);

			$property = $this->ucProperties[$property];
			$output[] = "'{$property}' => '{$prettyProperty}'"; // output de properties.
			$this->names[$property] = $prettyProperty;
			
		}
		foreach($this->relationproperties as $property=>$mapping)
		{
				$output[] = "'{$mapping}' => '{$mapping}'"; // output de properties
		}
		if($this->primaryProperty == '')
		{
			foreach ($this->properties as $property=>$info) // loop alle properties af.
			{
				if($this->primaryProperty == '' && strpos(strtolower($info->Type),'varchar') !== false) 
				{
					$this->primaryProperty = $this->ucProperties[$property];
					$this->primaryPropertyValue = $this->prettyNotation($this->ucProperties[$property]);
				}
			}

			if($this->primaryProperty == '')
			{
				$this->primaryProperty = $this->primaryKey;
				$this->primaryPropertyValue = $this->prettyNotation($this->ucProperties[$this->primaryKey]);
					
				
			}
		}
		return(implode(", \r\n \t\t\t\t\t\t", $output));
	}

	



	function createEditor()
	{
			foreach ($this->ucProperties as $property=>$displayName)
			{
					foreach ($this->relations as $table=>$type)
					{
						if($virtuals[$table]->primaryKey == strtolower($property))
						{
							unset ($this->names[$property]);
						}
					}
			}
			foreach ($this->ucProperties as $property=>$displayName)
			{
				$extra = array();
				$displayName= $this->properties[strtolower($property)];
				$origtype = ($this->dbInfo[strtolower($property)]->Type);
				switch ($this->types[$displayName])
				{
					case 'dat':
						$type='dateEditor';
					break;
					case 'enm':
						$type='enumSelect';
					break;
					case 'int':
						$type='integerInput';
					break;	
					case 'chr':
						$type='BOOLEAN';
					break;
					case 'blb':
						$type='fileInput';
					break;
					default:
						$prop = explode("(", strtolower($origtype));
						$prop = strtoupper($prop[0]);
						switch ($prop)
						{
							
							case 'ENUM':
								$type = 'enumSelect';
							break;
							case 'SET':
								$type= 'setSelect';
							break;
							case 'DATE':
								$type = 'dateEditor';
							break;
							case 'BLOB':
								$type='fileInput';
							break;
							case 'TEXT':
							case 'MEDIUMTEXT':
							case 'LONGTEXT':
								$type='fckInput';
							break;
							case 'DOUBLE':
								$type = 'textInput';
							break;
							break;
							case 'CHAR':
								$type = 'radioInput';
							break;
							case 'VARCHAR':
							default:
								$type = 'textInput';
							break;
						}					
					break;
				}
				preg_match("!([0-9]+)!", $origtype, $length);
				$maxlength = (!empty($length[1])) ? ", {$length[1]}" : '';
				$prop = strtolower($property);
				if(array_key_exists($prop, $this->editortypes)) {
					$type = $this->editortypes[$prop];
					
				}
				if($displayName != '')
				{
				$extra = implode(",", $extra); 
				$output .= '$'."editor->{$displayName} = new {$type}('{$displayName}'{$extra}); \t// {$origtype}\r\n\t\t\t";
				}
			}

		return($output);
	}





}