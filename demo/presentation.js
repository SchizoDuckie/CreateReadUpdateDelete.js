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
		//console.log("Displaying presentation "+this.get('name'));
		//console.log(this.databaseValues);
		var d = document.createElement('div');
		d.innerHTML = 'Presentation:'+ this.get('name');
		d.id = 'pres_'+this.getID();
		document.body.appendChild(d);
		// find slides for this presentation, it's a many:many relation.
		this.Find(Slide, {}).then(function(slides) {
			for(var i = 0; i< slides.length; i++) {
				slides[i].display(d.id);
			}
		});
	}
});