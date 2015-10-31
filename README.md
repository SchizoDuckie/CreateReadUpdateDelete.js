CreateReadUpdateDelete.js
=========================

CreateReadUpdateDelete.js aims to bring you a tiny footprint, platform independent ORM/ActiveRecord implementation for Javascript that works flawlessly on SQLite / WebSQL databases,
or any flavor of remote database you can think of via serverside JSON API

Written in Plain Old JavaScript without any framework dependencies, you can use this with Mootools, Jquery, Zepto, Ember, or whatever your drug of choice is.

ActiveRecord? Orm?
==================
ActiveRecord/ORM is a technique that fits perfectly into the DRY (Don't Repeat Yourself) paradigm. 
It takes away all the hassle of creating Insert, Select, Update and Delete database queries. You create your an instance of your entity, set some properties, call Persist, and a database record is created automagicaly.
If the object you're referring to already exists in the database, it will be updated.

Want to find related data? Instantiate an object, call Find() on it with the filters you need, and the onComplete callback returns you your data.

If you're doing data storage right, you don't have to write *any* SQL, at all.

Features 
========

- Works on any browser that supports WebSQL (yes, also on mobile)
- Works even without [schema-defined foreign keys](https://www.sqlite.org/foreignkeys.html) by just matching primary keys
- Simple access to WebSQL database rows as if they're plain javascript objects
- A simplified query language, but the freedom to execute plain SQL
- Support for indexes, fixtures and migrations
- Completely promise-based. (Use promise.js for browsers that don't have a native Promise object)
- Built-in caching / entity manager layer makes sure you'll get a handle to the same entity when it's fetched again
- Supports 1:1, 1:many, many:1 and many:many relations


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
CRUD.Find(Serie, { name: 'Arrow' }).then(function(series) { // Find returns an array by default
	console.log("Found results: ", series);
});

CRUD.FindOne(Serie, { name: 'Arrow' }).then(function(serie) { // FindOne does  a limit 0,1
	console.log("Found one result: ", serie);
});

CRUD.Find(Serie, ['name like "%Arr%"']).then(function(series) { // You can pass an array instead of mapped object to add custom sql 
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


Topics
======

- [CRUD.Define: Introduction and conventions](#cruddefine-introduction-and-conventions)
- [CRUD.Define: Setting up a basic entity](#cruddefine-setting-up-a-basic-entity)
- [CRUD.Define: 1:1 relation](#cruddefine-11-relation)
- [CRUD.Define: 1:many relation](#cruddefine-1many-relation)
- [CRUD.Define: many:1 relation](#cruddefine-many1-relation)
- [CRUD.Define: many:many relation](#cruddefine-manymany-relation)
- [CRUD.Define: Default orderBy property and orderBy direction](#cruddefine-default-orderby-property-and-orderby-direction)
- [CRUD.Define: Custom orderBy clause](#cruddefine-custom-orderby-clause)
- [CRUD.Define: Defining fixtures](#cruddefine-defining-fixtures)
- [CRUD.Define: Indexes](#cruddefine-indexes)
- [CRUD.Define: Migrations](#cruddefine-migrations)
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


JS Docs
=======
[Check out the full jsdoc here](http://schizoduckie.github.io/CreateReadUpdateDelete/docs/)


CRUD.Define: Introduction and conventions
=========================================

- Define your entities and then create a database connection

```javascript
// initialize WebSQL database connection
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete', {
    estimatedSize: 25 * 1024 * 1024
}));
```


CRUD.Define: Setting up a basic entity
======================================

Make sure you define your entities before opening the database connection using CRUD.setAdapter.

```javascript
CRUD.define(Serie, {
    table: 'Series', // Database table this entity is bound to
    primary: 'ID_Serie', // Primary key. Make sure to use uniquely named keys, don't use 'id' on every table and refer to 'id_something'
    fields: [ // List all individual properties. Accessors will be auto-created (but can be overwritten)
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

CRUD.Define: 1:1 relation
=========================

```javascript




```

CRUD.Define: 1:many relation
============================

CRUD.Define: many:1 relation
============================

CRUD.Define: many:many relation
===============================

CRUD.Define: Default orderBy property and orderBy direction
===========================================================

CRUD.Define: Custom orderBy clause
==================================

CRUD.Define: Defining fixtures
==============================

CRUD.Define: Indexes
====================

CRUD.Define: Migrations
=======================

Usage: Opening a database connection
====================================

Usage: Using CRUD.Find and CRUD.FindOne
=======================================

Usage: Using Find on an entity instance to fetch related entities
=================================================================

Usage: Using FindOne
====================

Usage: Save changes to an entity to the database
================================================

Usage: Deleting an entity
=========================

Usage: Connecting entities
==========================

Advanced: Deep filters on related records using CRUD.Find
=========================================================

Advanced: Using CRUD.fromCache to convert a plain JavaScript Object into a CRUD Entity
======================================================================================

Advanced: Loading data from JSON and inserting it into the database
===================================================================

Advanced: Using CRUD.executeQuery
=================================

Advanced: Active Query Monitor using Object.observe
===================================================

Advanced: CRUD.EntityManager ensures you have a handle to the same record in different contexts
===============================================================================================

Advanced: Migrations in WebSQL: Adding a column to the database
===============================================================

Advanced: Interacting with a Select2 via JQuery
===============================================