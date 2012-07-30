var Presentation = CRUD.define({
		className: 'Presentation',
		table : 'presentations',
		primary : 'ID_Presentation',
		fields: ['ID_Presentation','ID_Client','name','template','forceUpdate', 'lastUpdated','lastAccessed','ID_Catalog', 'ID_Category', 'globalCSS','globalJS'],
		relations: {
			'Slide': CRUD.RELATION_MANY
		},
		connectors: {
			'Slide' : 'Presentationslide'
		},
		createStatement: 'CREATE TABLE "presentations" ("ID_Presentation" INTEGER PRIMARY KEY  NOT NULL ,"ID_Client" int(4) NOT NULL ,"name" varchar(256) DEFAULT (NULL) ,"template" varchar(50) NOT NULL ,"forceUpdate" char(1) NOT NULL  DEFAULT ("1") ,"lastUpdated" timestamp NOT NULL  DEFAULT ("0000-00-00 00:00:00") ,"lastAccessed" timestamp NOT NULL  DEFAULT ("0000-00-00 00:00:00") ,"ID_Catalog" INTEGER NOT NULL , "ID_Category" INTEGER, "globalCSS" TEXT, "globalJS" TEXT)',
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