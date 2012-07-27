Presentationslide = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'Presentationslide',
		table : 'presentations_slides',
		primary : 'ID_PresentationSlide',
		fields: ['ID_PresentationSlide', 'ID_Presentation', 'ID_Slide', 'slideIndex', 'subSlideIndex'],
		relations: {
			'Presentation': RELATION_FOREIGN,
			'Slide': RELATION_FOREIGN
		},
		adapter: 'dbAdapter'
	},

	display: function() {
		return new Element("div", {html: "Presentationslide: "+this.get('Name') });
	}
});
