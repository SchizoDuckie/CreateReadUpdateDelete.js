var Slide = CRUD.define({
		className: 'Slide',
		table : 'slides',
		primary : 'ID_Slide',
		fields: ['ID_Slide','Title','SubTitle','Content', 'lastUpdated'],
		
		relations: {
			'Presentation': CRUD.RELATION_MANY,
			'Slidetemplate': CRUD.RELATION_FOREIGN
		},
		connectors: {
			'Presentation' : 'Presentationslide'
		},
		fixtures: [
			{ 'ID_Slide' : 1, Title: 'Slide 1', Content: 'I\'m slide number 1' },
			{ 'ID_Slide' : 2, Title: 'Slide 2', Content: 'I\'m slide number 2' },
			{ 'ID_Slide' : 3, Title: 'Slide 3', Content: 'I\'m slide number 3' },
			{ 'ID_Slide' : 4, Title: 'Slide 4', Content: 'I\'m slide number 4' },
			{ 'ID_Slide' : 5, Title: 'Slide 5', Content: 'I\'m slide number 5' },
			{ 'ID_Slide' : 6, Title: 'Slide 6', Content: 'I\'m slide number 6' },
			{ 'ID_Slide' : 7, Title: 'Slide 7', Content: 'I\'m slide number 7' },
			{ 'ID_Slide' : 8, Title: 'Slide 8', Content: 'I\'m slide number 8' },
			{ 'ID_Slide' : 9, Title: 'Slide 9', Content: 'I\'m slide number 9' },
			{ 'ID_Slide' : 10, Title: 'Slide 10', Content: 'I\'m slide number 10' }
		],
		createStatement: 'CREATE TABLE slides ( ID_Slide INTEGER PRIMARY KEY NOT NULL,  Title varchar(250) NOT NULL,  SubTitle varchar(1024) NULL,  Content mediumtext NULL, lastUpdated timestamp NULL)',
	}, {
	display: function() {
		document.body.innerHTML += "<br>- > "+this.get('Title');
	}
});