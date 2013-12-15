var Presentation = CRUD.define({
		className: 'Presentation',
		table : 'presentations',
		primary : 'ID_Presentation',
		fields: ['ID_Presentation','name','template','forceUpdate', 'lastUpdated','lastAccessed','ID_Catalog', 'ID_Category', 'globalCSS','globalJS'],
		relations: {
			'Slide': CRUD.RELATION_MANY
		},
		connectors: {
			'Slide' : 'Presentationslide'
		},
		createStatement: 'CREATE TABLE "presentations" ("ID_Presentation" INTEGER PRIMARY KEY  NOT NULL ,"name" varchar(256) DEFAULT (NULL) ,"template" varchar(50) NOT NULL ,"forceUpdate" char(1) NULL  DEFAULT (1) ,"lastUpdated" timestamp NULL ,"lastAccessed" timestamp  NULL,"ID_Catalog" INTEGER NULL , "ID_Category" INTEGER NULL, "globalCSS" TEXT, "globalJS" TEXT)',
		adapter: 'dbAdapter',
		defaultValues: {
			forceUpdate: 1,
			globalCSS: 'border: 1px solid black;'
		},

		fixtures: [
			{ 
			  'ID_Presentation': 1,
			  name: 'test1',
			  template: 'test',
			  lastUpdated: new Date()
			},
			{ 
			  'ID_Presentation': 2,
			  name: 'test2',
			  template: 'test2',
			 lastUpdated: new Date()
			}


		]
		
	}, {

	display: function() {
		
		document.getElementById('presentations').innerHTML += this.get('name')+'<br>';

		document.getElementById('presentationTitle'+this.getID()).innerHTML = this.get('name');
		// find slides for this presentation, it's a many:many relation.
		this.Find(Slide, {}).then(function(slides) {
			document.getElementById('presentation'+this.getID()).innerHTML = 'Content loaded at '+new  Date().toJSON()+'!<br>';
			for(var i = 0; i< slides.length; i++) {
				slides[i].display('presentation'+this.getID());
			}
		}.bind(this));
	}
});