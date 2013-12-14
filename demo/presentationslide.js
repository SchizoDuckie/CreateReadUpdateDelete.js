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
		fixtures: [
			{ 'ID_Presentation': 1, 'ID_Slide' : 1 },
			{ 'ID_Presentation': 1, 'ID_Slide' : 2, slideIndex: 1},
			{ 'ID_Presentation': 1, 'ID_Slide' : 3, slideIndex: 2},
			{ 'ID_Presentation': 1, 'ID_Slide' : 4, slideIndex: 3 },
			{ 'ID_Presentation': 1, 'ID_Slide' : 5, slideIndex: 4 },
			{ 'ID_Presentation': 2, 'ID_Slide' : 6 },
			{ 'ID_Presentation': 2, 'ID_Slide' : 7, slideIndex: 1 },
			{ 'ID_Presentation': 2, 'ID_Slide' : 8, slideIndex: 2 },
			{ 'ID_Presentation': 2, 'ID_Slide' : 9, slideIndex: 3 },
			{ 'ID_Presentation': 2, 'ID_Slide' : 10, slideIndex: 4 },
		],
		createStatement: 'CREATE TABLE "presentations_slides" ("ID_PresentationSlide" INTEGER PRIMARY KEY  NOT NULL ,"ID_Presentation" INT NOT NULL, "ID_Slide" INT NOT NULL, "slideIndex" INTEGER default 0,"subSlideIndex" INTEGER DEFAULT 0)',
	}, {
	display: function() {
		return new Element("div", {html: "Presentationslide: "+this.get('Name') });
	}
});
