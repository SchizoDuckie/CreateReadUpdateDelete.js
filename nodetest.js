var CRUD = require('./src/CRUD.SqliteAdapter');
CRUD.DEBUG = true;

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


CRUD.define(Actor_Role, {
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
CRUD.setAdapter(new CRUD.SQLiteAdapter('createreadupdatedelete_demo.sqlite', {
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

	doctorwho.Connect(thedoctor);
	thedoctor.Connect(ten);
	// this also works
	twelve.Connect(thedoctor);
	eleven.Connect(thedoctor);

});