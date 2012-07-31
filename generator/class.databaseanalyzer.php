<?php

class databaseanalyzer
{
	var $db, $tables, $field, $primaryKeys, $fieldList, $relations, $tableList, $virtuals, $generateoptions;
	
	function __construct($db)
	{
		$this->db = $db;
		$this->generateoptions = array(
			'display' => true,
			'displayshort'=> true,
			'displayeditor'=> true

			);
		$this->Analyze();
		
	}

	public static function getInstance($database)
    {
		if(array_key_exists($database, $_SESSION['analyzers']))
		{
			return(unserialize($_SESSION['analyzers'][$database]));
		}
		else
		{
			return new databaseAnalyzer($database);

		}
    }

	function storeToSession()
	{
		$_SESSION['analyzers'][$this->db] = serialize($this);
	}
			
	/*
		This is where the true magic happens. This analyzes the relations between al the tables in the database.
		I've tried to keep the code as verbose as possible, i think you'll get the point 
	*/
	function Analyze()
	{
		$db = dbConnection::getInstance();
		$db->database = $this->db;
		$tables = $db->fetchAll("show tables", "mysql_fetch_array"); // first fetch all the databases
	
		if(sizeof($tables) > 0)
		{
			foreach ($tables as $table)
			{
				$this->tables[] = $table[0];								// store them all
				$currentTable = $table[0];
				$rows = $db->fetchAll("describe {$this->db}.{$currentTable}");		// describe current table
				$virtualTable = new virtualObject($this->db, $currentTable, $rows);		// convert it to virtualObject
				$this->primaryKeys[$virtualTable->getPrimaryKey()][] = $currentTable;	// find primary keys, and store ze op in a global array with this object attached to it
				$this->virtuals[$currentTable] = $virtualTable;					// store this virtualObject too.
				
			}

			foreach ($this->primaryKeys as $field=>$tables)						// then walk all primary keys of the database again
			{
				foreach ($this->tables as $id => $table)						// and find all tables where this key exists
				{
					if ($this->virtuals[$table]->hasProperty($field))			
					{
						$this->virtuals[$table]->addRelation($tables[0]);		// if that's true, it's a relation to $tables[0]
					}
				}
			}

			foreach ($this->virtuals as $table => $object)						// run it again and find all foreign relations
			{
				$object->findForeignRelations($this->virtuals);					
			}
			
			foreach ($this->virtuals as $table => $object)						// run it again and find al many:many relations (2 foreign keys where one of them is $this)
			{
				$object->findMultiRelations($this->virtuals);					
			
			foreach ($this->virtuals as $table=>$object)
			{
				$object->cleanup($this->virtuals);								// throw away the unnessecary stuff.
			}
		}
		}
		$this->storeToSession();												// and don't re-run the analyzer again for this database.
	}

	function getName($table)
	{
		if ($this->virtuals[$table]->name == '')
		{
			if (strpos($this->virtuals[$table]->primaryKey, '_') !== false)
			{
				$nam = explode("_", $this->virtuals[$table]->primaryKey);
				if (sizeof($nam) >= 2)
				{
					foreach ($nam as $key=>$val)
					{
						if (strtolower($val) == 'id')
						{
							unset ($nam[$key]);
						}
					}
					$this->virtuals[$table]->name = implode("", $nam);
				}
			}
			else
			{
				$this->virtuals[$table]->name = ucFirst($this->virtuals[$table]->table);
			}
		}
		
		return (ucFirst($this->virtuals[$table]->name));
	}

	public static function displayDatabases()
	{
		$output = array();
		$dbs = dbConnection::getInstance()->fetchAll("show databases"); 
		foreach($dbs as $database)
		{
			$output[] = array("./ajax/selectdb/{$database->Database}", $database->Database);
		}
		
		return($output);
	
	}

	function display()
	{
		$id = 'databases_'.$this->db;

		$checked1 = ($this->generateoptions['display']) ? ' checked' :'';
		$checked2 = ($this->generateoptions['displayshort']) ? ' checked' : '';
		$checked3 = ($this->generateoptions['displayeditor']) ? ' checked' : '';
		$output .= "<div class='windowMenu'>
			<ul>
				<li><a href='#' onclick='return false'>Generate</a></strong>
				<ul>
					<li><a class='mochiLink' href='./generate/interface/{$this->db}'>Generate CRUD Interface</a></li>
					<li><a class='mochiLink' href='./generate/classes/{$this->db}'>Generate All Classes</a></li>
					<li><a class='mochiLink' href='./generate/plugins/{$this->db}'>Generate All Plugins</a></li>
				</ul>		
		
				</li>
				<li><a href='#' onclick='return false'>Visualize</a></strong>
				<ul>
					<li><a class='mochiLink' href='./graph/{$this->db}/'>View Graphviz</a></li>
				</ul>		
		
				</li>
			</ul>
		</div>
<h3 class='databasename'>Database: {$this->db}</h3>
	<div id='{$id}'>
		<h4>Tables</h4>
		<div>
		<ul id='tableList'>";
		if(!empty($this->virtuals))
		{
			foreach($this->virtuals as $object)
			{
				$output.= $object->displayLI();
			}
		}
		$output .= "</ul>
		</div>
		<h4>Options</h4>
		<div>
			<form method='post' action='./ajax/generationoptions/{$this->db}/' onsubmit='$(this).send(); return false'>
			<h3>Database wide generation options</h3>
			<input type='checkbox' id='display_{$this->db}' name='display' value='true' {$checked1}>
			<label for='displayShort_{$this->db}'>Generate display() function</label><br>
			<input type='checkbox' id='displayShort_{$this->db}' name='displayshort' value='true' {$checked2}>
			<label for='displayShort_{$this->db}'>Generate displayShort() function</label><br>
			<input type='checkbox' id='displayEditor_{$this->db}' name='displayeditor' value='true' {$checked3} >
			<label for='displayEditor_{$this->db}'>Generate displayEditor() function</label><br>
			<input type='submit' value='Save changes'>
			</form>
		</div>
		<h4>Code generation</h4>
		<div>
			<p>You can create a .zip file with a complete CRUD <small>(Create, Read, Update Delete)</small> interface for this database with one click.<br> This wraps up any changes you made to property mappings directly into the dbObjects.<br>Note that this gives <em>FULL CONTROL</em> over the contents of your database so beware to deploy behind some sort of authentication. Also note that this will ignore the database wide generation options above because they are needed.</p>
			<a class='button' href='./generate/interface/{$this->db}'>Generate CRUD Interface</a><br>
			<p>Generate only all classes in this database to a .zip file. This respects the database wide generation options *and* any changes you made to mappings. Use this if you just want to drop in Pork.dbObject and your data model into your existing project. Note that you could alter the class template in the /templates folder</p>
			<a class='button' href='./generate/classes/{$this->db}'>Generate All Classes</a>
			<p>Generate only all plugins for the classes in this database to a .zip file. Note that you could alter the plugin template in the /templates folder</p>
			<a class='button' href='./generate/plugins/{$this->db}'>Generate All Plugins</a>
			</ul>

		</div>
		<script type='text/javascript'>
			setTimeout( function() {
				var tabs1 = new SimpleTabs($('{$id}'), {
				entrySelector: 'h4'
			});
			}, 50);
		</script>
		";
		return($output);
	}

	function displayTable($table)
	{
		if (array_key_exists($table, $this->virtuals))
		{
			return("<div class='windowMenu'>
			<ul>
				<li><a href='#' onclick='return false'>Generate</a></strong>
				<ul>
					<li><a href='#' class='ajaxlink' onclick='generateClass(\"{$this->db}\", \"{$table}\"); return false'>Generate Class</a></li>
					<li><a href='#' class='ajaxlink' onclick='generatePlugin(\"{$this->db}\", \"{$table}\"); return false'>Generate Plugin</a></li>
				</ul>		
				</li>
			</ul>
			</div>".$this->virtuals[$table]->display()."\r\n");
		}
	}

	
	function displayGraphViz($table=false)
	{
		$this->Analyze();
		$output  = '
		graph ER {
			rankdir=UD;
			fontname=arial;
			bgcolor=transparent;
			fontcolor=000000;
			concentrate=true;
			 node [shape=plaintext];
		';
		
		$tables = array();
		$relations = array();
		$rellines = array();
		
		if($table !== false)
		{
			$starttable = $this->virtuals[$table];
			
			$tables[$table] = $starttable->displayGraphViz(0);

			foreach($starttable->relations as $srctable=>$type)
			{
				$tables[$srctable] = $this->virtuals[$srctable]->displayGraphViz(1);
				$rellines[$object->table][$srctable] = $srctable;
			}
			foreach($starttable->multiRelations as $sourcetbl=>$targettbl)
			{
				if(array_key_exists($sourcetbl, $this->virtuals))
				{
					$tables[$sourcetbl] = $this->virtuals[$sourcetbl]->displayGraphViz(2);
				}
				if(array_key_exists($targettbl, $this->virtuals))
				{
					$tables[$targettbl] = $this->virtuals[$targettbl]->displayGraphViz(1);
				}
				$rellines[$object->table][$targettbl][$sourcetbl] = $targettbl;
			}
		}
		else
		{
		
			foreach($this->virtuals as $object)
			{
				$tables[$object->table] = $object->displayGraphViz();
				foreach($object->relations as $srctable=>$type)
				{
					$tables[$srctable] = $this->virtuals[$srctable]->displayGraphViz(1);
					$rellines[$object->table][$srctable] = $srctable;
				}
				foreach($object->multiRelations as $sourcetbl=>$targettbl)
				{
					if(array_key_exists($sourcetbl, $this->virtuals))
					{
						$tables[$sourcetbl] = $this->virtuals[$sourcetbl]->displayGraphViz(2);
					}
					if(array_key_exists($targettbl, $this->virtuals))
					{
						$tables[$targettbl] = $this->virtuals[$targettbl]->displayGraphViz(1);
					}

					$rellines[$object->table][$targettbl][$sourcetbl] = $targettbl;
				}
			}
			
		}
		
		
		$output .= implode(';', array_keys($tables))."\r\n";
		foreach($tables as $table=>$viz)
		{

			$output .= "\r\n".$viz."\r\n";
		}
		
		foreach($rellines as $currentTable=>$connectedTables)
		{
			foreach($connectedTables as $connectedTable)
			{
				if(array_key_exists($currentTable, $rellines[$connectedTable]) !== false)
				{
				//	unset($rellines[$connectedTable][$currentTable]);
				}
			}
		}
		
		foreach($rellines as $table=>$array)
		{
			if(sizeof($array) > 0)
			{
				$keys = array_keys($array);
				$output .= "{$keys[0]} -- {$table} -- {$keys[1]}\r\n";
				
			}
		}

		$output .= "}";
		$viz = new Graphviz();
		$viz->generate($output);
	}


}










?>