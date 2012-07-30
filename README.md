CreateReadUpdateDelete.js
=========================

CreateReadUpdateDelete.js aims to bring you a tiny footprint, platform independent ORM/ActiveRecord implementation for Javascript that works flawlessly on SQLite / WebSQL databases,
or any flavor of remote database you can think of via serverside JSON API

Written in Plain Old JavaScript without any framework dependencies, you can use this with Mootools, Jquery, Zepto, Ember, or whatever your drug of choice is.

ActiveRecord? Orm?
==================
ActiveRecord/ORM is a technique that fits perfectly into the DRY (Don't Repeat Yourself) paradigm. 
It takes away all the hassle of creating Insert, Select, Update and Delete database queries. You create your class, set some properties, call Save, and a database record is created automagicaly.
If the object you're referring to already exists in the database, it will be updated.

Want to find related data? Instantiate an object, call Find() on it with the filters you need, and the onComplete callback returns you your data.

If you're doing data storage right, you don't have to write *any* SQL, at all.

Example, connecting to sqlite
=============================

First, define an adapter. In this case we use an SQLiteAdapter to the database 'myDbName '

```javascript
window.dbAdapter = new CRUD.SQLiteAdapter('myDbName');
```

Then, define some entity objects using CRUD.define

```javascript
var Presentation = CRUD.define({
		className: 'Presentation',
		table : 'presentations',
		primary : 'ID_Presentation',
		fields: ['ID_Presentation','ID_Client','name','template','forceUpdate', 'lastUpdated','lastAccessed','ID_Catalog', 'ID_Category'],
		relations: {
			'Slide': CRUD.RELATION_MANY
		},
		connectors: {
			'Slide' : 'Presentationslide' // connectors are the way for RELATION_MANY to see what the joining table is
		},
		adapter: 'dbAdapter'
	}, {

	display: function() {
		//console.log("Displaying presentation "+this.get('name'));
		//console.log(this.databaseValues);
		var d = document.createElement('div');
		d.innerHTML = 'Presentation:'+ this.get('name');
		d.id = 'pres_'+this.getID();
		document.body.appendChild(d);
		// find slides for this presentation, it's a many:many relation.
		this.Find(Slide, {}, { onSuccess: function(slides) {
			for(var i = 0; i< slides.length; i++) {
				slides[i].display(d.id);
			}
		}});
	}
});
```

These entity objects map directly to an Sqlite database table. In this case we're setting up a many:many relationship

```javascript
var Slide = CRUD.define({
		className: 'Slide',
		table : 'slides',
		primary : 'ID_Slide',
		fields: ['ID_Slide','ID_User','Title','SubTitle','Content1','Content2', 'Content3','ID_Slidetemplate'],
		
		relations: {
			'Presentation': CRUD.RELATION_MANY,
			'Slidetemplate': CRUD.RELATION_FOREIGN
		},
		connectors: {
			'Presentation' : 'Presentationslide'
		},
		adapter: 'dbAdapter'
	}, {

	display : function(target) {
		var d = document.createElement('div');
		d.innerHTML = this.get('ID_Slide') + ' - '+ this.get('Title')  + ' - '+ this.get('SubTitle');

		target = target ? document.getElementById(target) : document.body;
		target.appendChild(d);
	}

});
```

The connecting table is also defined as an entity, but this has 2 foreign relations.

```javascript
var Presentationslide = CRUD.define({
		className: 'Presentationslide',
		table : 'presentations_slides',
		primary : 'ID_PresentationSlide',
		fields: ['ID_PresentationSlide', 'ID_Presentation', 'ID_Slide', 'slideIndex', 'subSlideIndex'],
		relations: {
			'Presentation': CRUD.RELATION_FOREIGN,
			'Slide': CRUD.RELATION_FOREIGN
		},
		defaultValues: {
			slideIndex: 0,
			subSlideIndex: 0
		},
		adapter: 'dbAdapter'
	}, {
	display: function() {
		return new Element("div", {html: "Presentationslide: "+this.get('Name') });
	}
});
```

We initialize the whole stuff on onload or domready like this:

```javascript
window.onload = function() {
	window.dbAdapter = new CRUD.SQLiteAdapter('myDbName');
	// This will return an array with Presentation objects on success.
	CRUD.Find(Presentation, {} , { onSuccess: function(result) {
			for (var i=0; i< result.length; i++) {
				result[i].display();
			}
		}
	});

}
```

To create a new Presentation, this is enough:

```javascript
var pres = new Presentation();
pres.set('name', 'test');
pres.Save();
```

A more advanced example: Create a Presentation and a Slide, and use Connect to automagically create the relation between them, in this many:many case a Presentationslide object.

```javascript
var pres = new Presentation();
pres.set({
	name: 'test presentation',
	template: 'ImageOnly'
})

var slide = new Slide();
slide.set({
	Content1: '<h1>Test!</h1>',
	Title : 'Test Slide',
	SubTitle: 'Test SubTitle'
});

pres.Connect(slide, { onComplete: function(r) {
          console.log("CREATED connection between presentation "+pres.getID()+" and slide "+slide.getID());
      }
});
```