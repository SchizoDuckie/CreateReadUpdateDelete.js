jsdbobject
===================

An almost 1:1 port of my PHP dbObject ORM to javascript. 
Includes full SQLite support, and a JSON REST API to load content from a remote datasource.
Removed Mootools Dependencies, so now you can use this with Mootools, Jquery, Zepto, Ember, or whatever your drug of choice is.


Example, connecting to sqlite
=============================

First, define an adapter. In this case we use an SQLiteAdapter to the database 'myDbName'

	```javascript
	window.dbAdapter = new dbObject.SQLiteAdapter('myDbName');

Then, define some entity objects using dbObject.define

	```javascript
	var Presentation = dbObject.define({
			className: 'Presentation',
			table : 'presentations',
			primary : 'ID_Presentation',
			fields: ['ID_Presentation','ID_Client','name','template','forceUpdate', 'lastUpdated','lastAccessed','ID_Catalog', 'ID_Category'],
			relations: {
				'Slide': dbObject.RELATION_MANY
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

These entity objects map directly to an Sqlite database table. In this case we're setting up a many:many relationship

	```javascript
	var Slide = dbObject.define({
			className: 'Slide',
			table : 'slides',
			primary : 'ID_Slide',
			fields: ['ID_Slide','ID_User','Title','SubTitle','Content1','Content2', 'Content3','ID_Slidetemplate'],
			
			relations: {
				'Presentation': dbObject.RELATION_MANY,
				'Slidetemplate': dbObject.RELATION_FOREIGN
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

The connecting table is also defined as an entity, but this has 2 foreign relations.

	```javascript
	var Presentationslide = dbObject.define({
			className: 'Presentationslide',
			table : 'presentations_slides',
			primary : 'ID_PresentationSlide',
			fields: ['ID_PresentationSlide', 'ID_Presentation', 'ID_Slide', 'slideIndex', 'subSlideIndex'],
			relations: {
				'Presentation': dbObject.RELATION_FOREIGN,
				'Slide': dbObject.RELATION_FOREIGN
			},
			adapter: 'dbAdapter'
		}, {
		display: function() {
			return new Element("div", {html: "Presentationslide: "+this.get('Name') });
		}
	});

We initialize the whole stuff on onload or domready like this:

	```javascript
	window.onload = function() {
		window.dbAdapter = new dbObject.SQLiteAdapter('myDbName');
		// This will return an array with Presentation objects on success.
		dbObject.Find(Presentation, {} , { onSuccess: function(result) {
				for (var i=0; i< result.length; i++) {
					result[i].display();
				}
			}
		});

	}

To create a new Presentation, this is enough:

	var pres = new Presentation();
	pres.set('name', 'test');
	pres.Save();