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

Docs
====
[Check out the full jsdoc here](http://schizoduckie.github.io/CreateReadUpdateDelete/docs/)


Topics
======

- CRUD.Define: Introduction and conventions
- CRUD.Define: [basic setup of an entity](http://jsfiddle.net/SchizoDuckie/1fwntkhr/)
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



An Entity
---------

```
/**
 * Create a nice Native function so that we can do console.log and see a Serie object
 */
function Serie() {
    CRUD.Entity.call(this);
}

/**
 * Extend the Named Function with CRUD definitions and register it in the CRUD.EntityManager
 * Signature:
 * CRUD.Define(Entity, {options}, {prototypeMethods});
 */
CRUD.define(Serie, {
    className: 'Serie', 	// String classname for the entity
    table: 'Series',		// Database table this entity is bound to
    primary: 'ID_Serie',	// Primary key. Make sure to use uniquely named keys, don't use 'id' on every table and refer to 'id_something'
    fields: [ 				// List all individual properties. Accessors will be auto-created (but can be overwritten)
    	'ID_Serie',
    	'name',
    	'banner',
    	'overview',
    	'TVDB_ID',
    	'actors'
    ],
    autoSerialize: ['actors'], // optional array of properties that will be json_encoded / decoded automagically.
    relations: {
    	// Foreign keys will be matched automagically based on the primary key of this table
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN,
        // Many to many relations have a connecting CRUD entity that has a foreign key to both this primary and the foreign primary.
        'Tag' : CRUD.RELATION_MANY 		  
    },
    indexes: [
        'name', 			// A create index statement will be automagically run to add any columns you list here
    ],
    // Provide your CREATE TABLE statement. CreateReadUpdateDelete will not autogenerate this for you
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, actors VARCHAR(1024) DEFAULT(NULL))',
    defaultValues: { // You can create a map of default values that you don't have in your schema here 
    	'actors': ['Some actor']
    }, 
    fixtures: [{ // Fixtures can be an optional array of objects that are inserted when the table is created
    	name: 'Marvels Agents of S.H.I.E.L.D',
    	TVDB_ID: 263365,
    	actors: [
	    	"Clark Gregg (Phil Coulson)",
	    	"Ming-Na Wen (Melinda May / Agent 33)",
	    	"Brett Dalton (Grant Ward)",
	    	"Chloe Bennet (Skye)",
	    	"Iain De Caestecker (Leo Fitz)"
    	],
    }], 
    migrations: {
    	// if you change your table schema, you can 
    }
}, {
    getEpisodes: function() {
        return Episode.findBySerie({
            ID_Serie: this.getID()
        }, {
            limit: 100000
        });
    },

    getSeasons: function() {
        return Season.findByID_Serie(this.getID());
    },

    getLastEpisode: function() {
        var filter = ['(Episodes.firstaired > 0 and Episodes.firstAired < ' + new Date().getTime() + ')'];
        filter.ID_Serie = this.getID();
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber desc, firstaired desc'
        }).then(function(result) {
            return result;
        });
    }
});
```


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