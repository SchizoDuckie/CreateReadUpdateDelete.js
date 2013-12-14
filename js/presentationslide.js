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
		createStatement: 'CREATE TABLE "presentations_slides" ("ID_PresentationSlide" INTEGER PRIMARY KEY  NOT NULL ,"ID_Presentation" INT NOT NULL, "ID_Slide" INT NOT NULL, "slideIndex" INTEGER default 0,"subSlideIndex" INTEGER DEFAULT 0)',
	}, {
	display: function() {
		return new Element("div", {html: "Presentationslide: "+this.get('Name') });
	}
});
