CreateReadUpdateDelete.js
=========================

CreateReadUpdateDelete.js aims to bring you a tiny footprint, platform independent ORM/ActiveRecord implementation for Javascript that works flawlessly on SQLite / WebSQL databases,
or any flavor of remote database you can think of via serverside JSON API

Written in Plain Old JavaScript without any framework dependencies, you can use this with AngularJS, React, Jquery, Mootools, Zepto, Ember, or whatever your framework drug of choice is.

ActiveRecord? Orm?
==================

*Active Record*
From Wikipedia:

> In software engineering, the active record pattern is an architectural pattern found in software that stores in-memory object data in relational databases. It was named by Martin Fowler in his 2003 book Patterns of Enterprise Application Architecture.[1] The interface of an object conforming to this pattern would include functions such as Insert, Update, and Delete, plus properties that correspond more or less directly to the columns in the underlying database table.

> The active record pattern is an approach to accessing data in a database. A database table or view is wrapped into a class. Thus, an object instance is tied to a single row in the table. After creation of an object, a new row is added to the table upon save. Any object loaded gets its information from the database. When an object is updated the corresponding row in the table is also updated. The wrapper class implements accessor methods or properties for each column in the table or view.

> This pattern is commonly used by object persistence tools, and in object-relational mapping (ORM). Typically, foreign key relationships will be exposed as an object instance of the appropriate type via a property.

*ORM*
(Loosely) From [service-architecture.com](http://www.service-architecture.com/articles/object-relational-mapping/object-relational_mapping_or_mapping_definition.html)
> Object-relational mapping (OR mapping) products integrate object programming language capabilities with relational databases. Database objects appear as programming language objects. Often, the interface for object-relational mapping products is the same as the interface for object databases.

Features 
========

- Simple access to WebSQL database rows as if they're plain javascript objects
- Supports 1:1, 1:many, many:1 and many:many relations
- Support for indexes, fixtures and migrations
- Completely promise-based. (Use promise.js for browsers that don't have a native Promise object)
- A simplified query language, but the freedom to execute plain SQL
- Works on any browser that supports WebSQL (yes, also on mobile)
- Works even without [schema-defined foreign keys](https://www.sqlite.org/foreignkeys.html) by just matching primary keys
- Built-in caching / entity manager layer makes sure you'll get a handle to the same entity when it's fetched again
- Auto-generates findBy<property> and findOneBy<property> methods 

Examples
========

Create
------

```javascript
var serie = new Serie();
serie.name = 'Arrow';
serie.TVDB_ID = '257655';
serie.actors = [
	"Stephen Amell (Oliver Queen / Arrow)",
	"Katie Cassidy (Laurel Lance)",
	"Paul Blackthorne (Detective Quentin Lance)",
	"David Ramsey (John Diggle)",
	"Willa Holland (Thea Queen)",
	"Emily Bett Rickards (Felicity Smoak)",
	"John Barrowman (Malcolm Merlyn)"
];

serie.Persist().then(function(result) {
	console.log("Serie persisted! ", result);
});
```


Read
----

```javascript
/**
 * CRUD.Find returns a promise that receives an array with results
 */
CRUD.Find(Serie, { name: 'Arrow' }).then(function(series) {
	console.log("Found results: ", series);
});

/**
 * CRUD.FindOne returns a promise that receives a single instance of an entity or null
 */
CRUD.FindOne(Serie, { name: 'Arrow' }).then(function(serie) {
	console.log("Found one result: ", serie);
});

/**
 * You can pass an array instead of mapped object to add custom SQL
 */
CRUD.Find(Serie, ['name like "%Arr%"']).then(function(series) { 
	console.log("Found wildcard results: ", serie);
});
```

Update
------
```javascript
CRUD.FindOne(Serie, {name: 'Arrow'}).then(function(arrow) {
	arrow.overview = [
		"Oliver Queen and his father are lost at sea when their luxury yacht sinks.",
		"His father doesn't survive. Oliver survives on an uncharted island for five years learning to fight,",
		"but also learning about his father's corruption and unscrupulous business dealings.",
		"He returns to civilization a changed man, determined to put things right.",
		"He disguises himself with the hood of one of his mysterious island mentors,",
		"arms himself with a bow and sets about hunting down the men and women who have corrupted his city."
	].join(' ');
	return arrow.Persist();
}).then(function(result) {
	console.log("Arrow update persisted!", result);
});
```

Delete
------
```javascript
CRUD.FindOne(Serie, {name: 'Arrow'}).then(function(arrow) {
	return arrow.Delete();
}).then(function(result) {
	console.log("Arrow deleted!");
});
```

[basic setup of an entity](http://jsfiddle.net/SchizoDuckie/1fwntkhr/)


Documentation and howto
=======================

- [CRUD.define: Introduction and conventions](#cruddefine-introduction-and-conventions)
- [CRUD.define: Setting up a basic entity](#cruddefine-setting-up-a-basic-entity)
- [CRUD.define: 1:1 relation](#cruddefine-11-relation)
- [CRUD.define: 1:many and many:1 relation](#cruddefine-1many-or-many1-relation)
- [CRUD.define: many:many relation](#cruddefine-manymany-relation)
- [CRUD.define: Default orderBy property and orderBy direction](#cruddefine-default-orderby-property-and-orderby-direction)
- [CRUD.define: Custom orderBy clause](#cruddefine-custom-orderby-clause)
- [CRUD.define: Defining fixtures](#cruddefine-defining-fixtures)
- [CRUD.define: Indexes](#cruddefine-indexes)
- [CRUD.define: Migrations](#cruddefine-migrations)
- [Usage: Opening a database connection](#usage-opening-a-database-connection)
- [Usage: Using CRUD.Find and CRUD.FindOne](#usage-using-crudfind-and-crudfindone)
- [Usage: Using Find on an entity instance to fetch related entities](#usage-using-find-on-an-entity-instance-to-fetch-related-entities)
- [Usage: Using FindOne](#usage-using-findone)
- [Usage: Save changes to an entity to the database](#usage-save-changes-to-an-entity-to-the-database)
- [Usage: Deleting an entity](#usage-deleting-an-entity)
- [Usage: Connecting entities](#usage-connecting-entities)
- [Advanced: Deep filters on related records using CRUD.Find](#advanced-deep-filters-on-related-records-using-crudfind)
- [Advanced: Using CRUD.fromCache to convert a plain JavaScript Object into a CRUD Entity](#advanced-using-crudfromcache-to-convert-a-plain-javascript-object-into-a-crud-entity)
- [Advanced: Loading data from JSON and inserting it into the database](#advanced-loading-data-from-json-and-inserting-it-into-the-database)
- [Advanced: Using CRUD.executeQuery](#advanced-using-crudexecutequery)
- [Advanced: Active Query Monitor using Object.observe](#advanced-active-query-monitor-using-objectobserve)
- [Advanced: CRUD.EntityManager ensures you have handle to the same record in different contexts](#advanced-crudentitymanager-ensures-you-have-a-handle-to-the-same-record-in-different-contexts)
- [Advanced: Using REPLACE INTO instead of the default INSERT INTO](#advanced-using-replace-into-instead-of-the-default-insert-into)
- [Advanced: Migrations in WebSQL: Adding a column to the database](#advanced-migrations-in-websql-adding-a-column-to-the-database)
- [Advanced: Interacting with a Select2 via JQuery](#advanced-interacting-with-a-select2-via-jquery)
- [Advanced: Browse the JSDocs](http://schizoduckie.github.io/CreateReadUpdateDelete/docs/)


CRUD.define: Introduction and conventions
=========================================

CRUD.define registers your entities in the EntityManager.

The Entity Manager performs the following tasks as soon as it's connected to a database:

- Fetch a list of all tables and indexes
- Verify that all tables for registered entities exist.
- Execute createStatements for entities if they haven't been created.
- Execute any migrations in sequence if the table version is smaller than the highest migration number
- Compare the list of indexes in the database to the ones defined and create the ones that don't exist
- Insert fixtures for tables that have been freshly created

To connect to a database, feed a new instance of a CRUD.SqliteAdapter to CRUD.setAdapter. 
This returns a promise that is resolved when all the setup steps are done, and after that you can use your entities.

```javascript
// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete', {
    estimatedSize: 25 * 1024 * 1024
})).then(function() {
	// do stuff with your CRUD entities here.
});
```

CRUD.define signature and parameters
------------------------------------

```javascript
/**
 * @param  {Function} namedFunction Named Function to register with the entity manager
 * @param  {object} properties entity config properties like table, primary, fields, createStatement
 * @param  {object} methods prototype methods to register on the entity instance
 * @return {Function} namedFunction enriched with CRUD methods and prototype methods
 */
CRUD.define = function(namedFunction, properties, methods) {};
```

 CRUD.define forwards registration of an entity to CRUD.EntityManager.
  
 Parameters passed to 'properties' should be at least:
 - `createStatement` : String, Full CREATE TABLE SQL statement
 - `table` : String, Table name used by createStatement
 - `primary` : String, Primary key property
 - `fields` : All properties (including primary key) created by the createStatement

  Optional properties can be:

 - `indexes` : Array, List of fields to create indexes on.
 - `relations` : Array, List of (String) Entity names and CRUD.RELATION_* types
 - `autoSerialize` : Array, properties to auto json_encode / json_decode on fetch/persist
 - `defaultValues` : Object, property -> default value list
 - `orderProperty` : String, default orderBy propery to append to CRUD.Find queries
 - `orderDirection` : String, default orderBy direction to append to CRUD.Find queries
 - `migrations` : Object, with numeric keys and array of raw sql migrations to run in sequence when current version doesn't match lastest.

CRUD.define: Setting up a basic entity
======================================

Make sure you define your entities before opening the database connection using CRUD.setAdapter.
The setup phase only runs on creating a connection. Defining new entities after the database is connected is not supported.

```javascript
/**
 * Create a nice Named Function that calls the CRUD.Entity constructor 
 * The Named function will make sure that we can do console.log and see a Serie object instead of CRUD.Entity
 * Adding ``CRUD.Entity.call(this)`` is mandatory and makes sure that the proper setup is performed when creating a new instance of the object.
 */
function Serie() {
    CRUD.Entity.call(this);
}

/**
 * Extend the Named Function with CRUD definitions and register it in the CRUD.EntityManager
 */
CRUD.define(Serie, {
    table: 'Series', // Database table this entity is bound to
    primary: 'ID_Serie', // Primary key. Make sure to use uniquely named keys, don't use 'id' on every table and refer to 'id_something'
    fields: [ // List all individual properties including primary key. Accessors will be auto-created (but can be overwritten)
        'ID_Serie',
        'name',
        'banner',
        'overview',
        'TVDB_ID',
        'actors'
    ],
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, actors VARCHAR(1024) DEFAULT(NULL))',
});
```

CRUD.define: 1:1 relation
=========================

To define a 1:1 relation, use the CRUD.RELATION_SINGLE relation type.
Simply define the fact that a relationship exists, CreateReadUpdateDelete will automatically deduct that the primary key from table A exists in table B and vice versa.

Consider this fictional scenario where every actor in the world can only play one role, ever.

```javascript

function Role() {
    CRUD.Entity.call(this);
}

function Actor() {
    CRUD.Entity.call(this);
}

CRUD.define(Role, {
    table: 'Roles', 
    primary: 'ID_Role',
    fields: ['ID_Role', 'name', 'ID_Actor'],
    relations: {
        	'Actor' : CRUD.RELATION_SINGLE
    },
    createStatement: 'CREATE TABLE Roles (ID_Role INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), ID_Actor INTEGER NULL)'
});

CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender', 'ID_Role'],
    relations: {
        	'Role' : CRUD.RELATION_SINGLE
    },
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL), ID_Role INTEGER NULL)'
});


// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete_single', {
    estimatedSize: 25 * 1024 * 1024
})).then(function() { // Promise resolves when all database setup is done

	// create a new role
	var cptn = new Role();
	cptn.name = 'Captain Jack Sparrow';

	// create a new actor
	var actor = new Actor();
	actor.firstname = 'Johnny';
	actor.lastname = 'Depp';
	actor.gender = 'm';

	// connect Actor to Role. Note that both will be auto-persisted at this point!
	// both entities will also have an update-query executed to set the 1:1 relation.
	cptn.Connect(actor);

	// the other way around also works.
	// role.Connect(actor);
})


```
JSFiddle live demo: [CreateReadUpdateDelete : Defining a 1:1 relation](http://jsfiddle.net/SchizoDuckie/0LuLe1sr)


CRUD.define: 1:many or many:1 relation
============================

To define a 1:many or many:1 relation, use the CRUD.RELATION_FOREIGN relation type.
Simply define the fact that a relationship exists, CreateReadUpdateDelete will automatically determine that the primary key from table A exists in table B or a primary key from table B exists in table A.
CreateReadUpdateDelete.js automatically makes sure that you can use this relationship from both sides.

Consider this more realistic scenario where one actor can play many roles over a lifetime.

```javascript

function Role() {
    CRUD.Entity.call(this);
}

function Actor() {
    CRUD.Entity.call(this);
}

CRUD.define(Role, {
    table: 'Roles', 
    primary: 'ID_Role',
    fields: ['ID_Role', 'name', 'ID_Actor'],
    relations: {
        	'Actor' : CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Roles (ID_Role INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), ID_Actor INTEGER NULL)'
});

CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    relations: {
        	'Role' : CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL), ID_Role INTEGER NULL)'
});


// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete_foreign', {
    estimatedSize: 25 * 1024 * 1024
})).then(function() { // Promise resolves when all database setup is done

	// create a new role
	var cptn = new Role(); 
	cptn.name = 'Captain Jack Sparrow';

	// create a new actor
	var actor = new Actor();
	actor.firstname = 'Johnny';
	actor.lastname = 'Depp';
	actor.gender = 'm';

	// connect Actor to Role. Note that both will be auto-persisted at this point!
	// role will be updated as well to set the Actor_ID
	actor.Connect(role);

	// the other way around also works.
	// role.Connect(actor);
});
```
JSFiddle live demo: [CreateReadUpdateDelete : Defining a 1:many or many:1 relation](http://jsfiddle.net/SchizoDuckie/0LuLe1sr)


CRUD.define: many:many relation
===============================

Many to many relations in CreateReadUpdateDelete.js require that you create an entity for the connecting table as well.
This connecting entity has to have at least 2 foreign keys, (one for each side of the relation) and a primary key.
Connector tables with only a combined primary key are NOT supported! Since it's a full CreateReadUpdateDelete.js entity, 
it needs an AUTO_INCREMENT numeric primary key just as any other CreateReadUpdateDelete.js entity.

Consider this real-world scenario where multiple roles can be played by multiple actors

```javascript

function Serie() {
	CRUD.Entity.call(this);	
}

function Role() {
    CRUD.Entity.call(this);
}

function Actor() {
    CRUD.Entity.call(this);
}

function Actor_Role() {
	CRUD.Entity.call(this);
}

CRUD.define(Serie, {
    table: 'Series',
    primary: 'ID_Serie', 
    fields: ['ID_Serie', 'name', 'TVDB_ID'],
    relations: {
        'Role': CRUD.RELATION_FOREIGN
    },
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL)',
});

CRUD.define(Role, {
    table: 'Roles', 
    primary: 'ID_Role',
    fields: ['ID_Role', 'name'],
    relations: {
		'Actor' : CRUD.RELATION_MANY
    },
    connectors: {
    	'Actor': 'Actor_Role'
    },
    createStatement: 'CREATE TABLE Roles (ID_Role INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL))'
});

CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    relations: {
        'Role' : CRUD.RELATION_MANY
    },
    connectors: {
    	'Role' : 'Actor_Role'
	},
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL))'
});

CRUD.define('Actor_Role', {
	table: 'Actors_Roles',
	primary: 'ID_Actor_Role',
	fields: ['ID_Actor_Role', 'ID_Actor', 'ID_Role'],
	relations: {
		'Actor': CRUD.RELATION_FOREIGN,
		'Role': CRUD.RELATION_FOREIGN
	},
	createStatement: 'CREATE TABLE Actors_Roles (ID_Actor_Role INTEGER PRIMARY KEY NOT NULL, ID_Actor INTEGER DEFAULT(NULL), ID_Role INTEGER DEFAULT(NULL))'
});


// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete_many', {
    estimatedSize: 25 * 1024 * 1024
})).then(function() { // Promise resolves when all database setup is done

	var doctorwho = new Serie();
	doctorwho.name = 'Doctor Who';
	doctorwho.TVDB_ID = 78804;

	var thedoctor = new Role();
	thedoctor.name = 'The Doctor';

	var twelve = new Actor();
	twelve.firstname ='Peter';
	twelve.lastname = 'Capaldi';

	var eleven = new Actor();
	eleven.firstname = 'Matt';
	eleven.lastname = 'Smith';

	var ten = new Actor();
	ten.firstname = 'David';
	ten.lastname = 'Tennant';

	doctorwho.connect(thedoctor);
	thedoctor.connect(ten);
	// this also works
	twelve.connect(thedoctor);
	eleven.connect(thedoctor);
});

```

JSFiddle live demo: [CreateReadUpdateDelete : Defining a many:many relation](http://jsfiddle.net/SchizoDuckie/pghy3kn4/)


CRUD.define: Default orderBy property and orderBy direction
===========================================================

```javascript
CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    orderProperty: 'lastname',
    orderDirection: 'ASC',
    relations: {
        'Role' : CRUD.RELATION_MANY
    },
    connectors: {
    	'Role' : 'Actor_Role'
	},
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL))'
});
```


CRUD.define: Custom orderBy clause
==================================

```javascript
CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    orderBy: 'lastname ASC, firstname DESC'
    relations: {
        'Role' : CRUD.RELATION_MANY
    },
    connectors: {
    	'Role' : 'Actor_Role'
	},
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL))'
});
```

CRUD.define: Defining fixtures
==============================

```javascript
CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    orderBy: 'lastname ASC, firstname DESC'
    relations: {
        'Role' : CRUD.RELATION_MANY
    },
    connectors: {
    	'Role' : 'Actor_Role'
	},
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL))'
	fixtures: [
		{ firstname: 'Peter', lastname: 'Capaldi', gender: 'm' },
		{ firstname: 'Matt', lastname: 'Smith', gender: 'm' },
		{ firstname: 'David', 'lastname': Tennant', gender: 'm' }
	],
});
```


CRUD.define: Indexes
====================

```javascript
CRUD.define(Actor, {
    table: 'Actors', 
    primary: 'ID_Actor',
    fields: ['ID_Actor', 'firstname', 'lastname', 'gender'],
    createStatement: 'CREATE TABLE Actors (ID_Actor INTEGER PRIMARY KEY NOT NULL, firstname VARCHAR(250) DEFAULT(NULL), lastname VARCHAR(250) DEFAULT(NULL), gender VARCHAR(1) DEFAULT(NULL))'
    indexes: ['firstname','lastname', 'gender'],
});
```

CRUD.define: Migrations
=======================

Usage: Opening a database connection
====================================

```javascript
// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete_foreign', {
    estimatedSize: 25 * 1024 * 1024
})).then(function() { // Promise resolves when all database setup is done

	// do stuff here
});
```

Usage: Using CRUD.Find and CRUD.FindOne
=======================================

Find returns an array:
```javascript
CRUD.Find(Serie, { name: 'Arrow'}).then(function(results) {
	// do something with results
});
```

FindOne returns a single entity
```javascript
CRUD.FindOne(Serie, { name: 'Arrow'}).then(function(results) {
	// do something with results
});
```

Usage: Using FindOne
====================

```javascript
CRUD.FindOne(Serie, { name: 'Arrow'}).then(function(arrow) {
	// do something with Arrow.
});
```

Find the first serie in the database that has an episode with seasonNumber 4

```javascript
CRUD.FindOne(Serie, { Episode: { seasonNumber: 4 }}).then(function(results) {
	// 
});
```


Usage: Using Find on an entity instance to fetch related entities
=================================================================

This auto creates a join where needed and executes [these] queries

```javascript
CRUD.FindOne(Serie, { name: 'Arrow'}).then(function(arrow) {
	arrow.Find('Episode', { seasonNumber: 1 }).then(function(episodes) {
		// do something with episodes
	});
});
```

Usage: Save changes to an entity to the database
================================================


```javascript
var serie = new Serie();
serie.name = 'Arrow';
serie.TVDB_ID = '257655';
serie.actors = [
	"Stephen Amell (Oliver Queen / Arrow)",
	"Katie Cassidy (Laurel Lance)",
	"Paul Blackthorne (Detective Quentin Lance)",
	"David Ramsey (John Diggle)",
	"Willa Holland (Thea Queen)",
	"Emily Bett Rickards (Felicity Smoak)",
	"John Barrowman (Malcolm Merlyn)"
];

serie.Persist().then(function(result) {
	console.log("Serie persisted! ", result);
});
```

Or, on an existing entity:

```javascript
CRUD.FindOne(Serie, { name: 'Arrow' }).then(function(serie) {
	
	serie.name = 'Arrow';
	serie.TVDB_ID = '257655';
	serie.actors = [];

	serie.Persist().then(function(result) {
		console.log("Serie actors were emptied! ", result);
	});
});
```


Usage: Deleting an entity
=========================


```javascript
CRUD.FindOne(Serie, { name: 'Arrow' }).then(function(serie) {
	
	serie.Delete().then(function(result) {
		console.log("Arrow was deleted. ", result);
	});
});
```

Usage: Connecting entities
==========================

```javascript
var doctorwho = new Serie();
	doctorwho.name = 'Doctor Who';
	doctorwho.TVDB_ID = 78804;

	var thedoctor = new Role();
	thedoctor.name = 'The Doctor';

	var twelve = new Actor();
	twelve.firstname ='Peter';
	twelve.lastname = 'Capaldi';

	var eleven = new Actor();
	eleven.firstname = 'Matt';
	eleven.lastname = 'Smith';

	var ten = new Actor();
	ten.firstname = 'David';
	ten.lastname = 'Tennant';

	doctorwho.connect(thedoctor);
	thedoctor.connect(ten);
	// this also works
	twelve.connect(thedoctor);
	eleven.connect(thedoctor);
```

Advanced: Deep filters on related records using CRUD.Find
=========================================================

```javascript
CRUD.Find(Episode, { Serie: { name:'Doctor Who'}, Season: { 'seasonNumber > 2' }, 'name like "%angels%"'})
```

Advanced: Using CRUD.fromCache to convert a plain JavaScript Object into a CRUD Entity
======================================================================================

```javascript

var fixtures = [
	{ ID_Actor: 1, firstname: 'Peter', lastname: 'Capaldi', gender: 'm' },
	{ ID_Actor: 2, firstname: 'Matt', lastname: 'Smith', gender: 'm' },
	{ ID_Actor: 3, firstname: 'David', 'lastname': Tennant', gender: 'm' }
];

fixtures.map(function(fixture) {
	var entity = CRUD.fromCache(Actor, fixture);
	entity.Persist(true);
});


Advanced: Loading data from JSON and inserting it into the database
===================================================================

Advanced: Using CRUD.executeQuery
=================================

Advanced: Active Query Monitor using Object.observe
===================================================

CreateReadUpdateDelete.js automatically monitors how many insert queries it still has outstanding. With this, you can observe changes to this object and show a progress indicator of all outstanding write operations.


```javascript
var progress = document.getElementById('progress'),
    writesQueued = document.getElementById('writesQueued'),
    writesExecuted = document.getElementById('writesExecuted');

Object.observe(CRUD.stats, function() {
   progress.innerHTML = Math.floor((CRUD.stats.writesExecuted / CRUD.stats.writesQueued) * 100);
   writesQueued.innerHTML = CRUD.stats.writesQueued;
   writesExecuted.innerHTML = CRUD.stats.writesExecuted; 
});

// now execute some insert queries and see the magic happen.
```

JSFiddle live demo: [CreateReadUpdateDelete : CRUD.stats monitoring via Object.observe](http://jsfiddle.net/SchizoDuckie/p7kta1mv/)


Advanced: CRUD.EntityManager ensures you have a handle to the same record in different contexts
===============================================================================================

Advanced: Migrations in WebSQL: Adding a column to the database
===============================================================

Advanced: Interacting with a Select2 via JQuery
===============================================