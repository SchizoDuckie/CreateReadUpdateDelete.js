Presentation = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'Presentation',
		table : 'presentations',
		primary : 'ID_Presentation',
		fields: ['ID_Presentation','ID_Client','Name','template','forceUpdate', 'lastUpdated','lastAccesse3d','ID_Catalog', 'ID_Category'],
		editorFields: {
			'Name': { label: 'Presentation Naam', placeholder: 'Weergave naam van uw Presentation', type: 'text', validation: 'validate-alphanumeric' }
		},
		relations: {
			'Slide': RELATION_MANY
		},
		connectors: {
			'Slide' : 'Presentationslide'
		},
		adapter: 'dbAdapter'
	},
	

	display: function() {
		return new Element("div", {html: "Presentation: "+this.get('Name') });
	}
});
