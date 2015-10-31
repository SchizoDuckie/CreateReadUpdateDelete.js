CreateReadUpdateDelete.js
=========================

CreateReadUpdateDelete.js aims to bring you a tiny footprint, platform independent ORM/ActiveRecord implementation for Javascript that works flawlessly on SQLite / WebSQL databases,
or any flavor of remote database you can think of via serverside JSON API

Written in Plain Old JavaScript without any framework dependencies, you can use this with Mootools, Jquery, Zepto, Ember, or whatever your drug of choice is.

ActiveRecord? Orm?
==================
ActiveRecord/ORM is a technique that fits perfectly into the DRY (Don't Repeat Yourself) paradigm. 
It takes away all the hassle of creating Insert, Select, Update and Delete database queries. You create your class, set some properties, call Persist, and a database record is created automagicaly.
If the object you're referring to already exists in the database, it will be updated.

Want to find related data? Instantiate an object, call Find() on it with the filters you need, and the onComplete callback returns you your data.

If you're doing data storage right, you don't have to write *any* SQL, at all.

Features 
========

- Simple access to WebSQL database rows as if they're plain javascript objects
- A simplified query language, but the freedom to execute plain SQL
- Support for indexes, fixtures and migrations
- Completely promise-based. (Use promise.js for browsers that don't have a native Promise object)
- Built-in caching / entity manager layer makes sure you'll get a handle to the same entity when it's fetched again
- Supports 1:1, 1:many, many:1 and many:many relations


Create
------

```
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

```
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
```
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
```
CRUD.FindOne(Serie, {name: 'Arrow'}).then(function(arrow) {
	return arrow.Delete();
}).then(function(result) {
	console.log("Arrow deleted!");
});
```

[basic setup of an entity](http://jsfiddle.net/SchizoDuckie/1fwntkhr/)


Topics
======

- CRUD.Define: Introduction and conventions
- CRUD.Define: Setting up a basic entity
- CRUD.Define: 1:1 relation
- CRUD.Define: 1:many relation
- CRUD.Define: many:1 relation
- CRUD.Define: many:many relation
- CRUD.Define: Default orderBy property and orderBy direction
- CRUD.Define: Custom orderBy clause
- CRUD.Define: Defining fixtures
- CRUD.Define: Indexes
- CRUD.Define: Migrations
- Usage: Opening a database connection
- Usage: Using CRUD.Find and CRUD.FindOne
- Usage: Using Find on an entity instance to fetch related entities
- Usage: Using FindOne
- Usage: Save changes to an entity to the database
- Usage: Deleting an entity
- Usage: Connecting entities
- Advanced: Deep filters on related records using CRUD.Find
- Advanced: Using CRUD.fromCache to convert a plain JavaScript Object into a CRUD Entity
- Advanced: Loading data from JSON and inserting it into the database
- Advanced: Using CRUD.executeQuery
- Advanced: Active Query Monitor using Object.observe
- Advanced: CRUD.EntityManager ensures you have handle to the same record in different contexts
- Advanced: Migrations in WebSQL: Adding a column to the database
- Advanced: Interacting with a Select2 via JQuery


JS Docs
=======
[Check out the full jsdoc here](http://schizoduckie.github.io/CreateReadUpdateDelete/docs/)


CRUD.Define: Introduction and conventions
=========================================

CRUD.Define: Setting up a basic entity
======================================

CRUD.Define: 1:1 relation
=========================

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

Advanced: CRUD.EntityManager ensures you have handle to the same record in different contexts
=============================================================================================

Advanced: Migrations in WebSQL: Adding a column to the database
===============================================================

Advanced: Interacting with a Select2 via JQuery
===============================================