var Presentation = dbObject.define({
		className: 'Presentation',
		table : 'presentations',
		primary : 'ID_Presentation',
		fields: ['ID_Presentation','ID_Client','name','template','forceUpdate', 'lastUpdated','lastAccessed','ID_Catalog', 'ID_Category'],
		relations: {
			'Slide': dbObject.RELATION_MANY
		},
		connectors: {
			'Slide' : 'Presentationslide'
		},
		adapter: 'dbAdapter'
	}, {

	display: function() {
		console.log("Displaying presentation "+this.get('name'));
		console.log(this.databaseValues);
		var d = document.createElement('div');
		d.innerHTML = 'Presentation:'+ this.get('name');
		d.id = 'pres_'+this.getID();
		document.body.appendChild(d);
		console.log(this.Find(Slide, {}, { onSuccess: function(slides) {
			for(var i = 0; i< slides.length; i++) {
				slides[i].display(d.id);
			}
		}}));
	}
});
