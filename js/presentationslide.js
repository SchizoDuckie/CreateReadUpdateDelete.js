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
