var Slide = dbObject.define({
		className: 'Slide',
		table : 'slides',
		primary : 'ID_Slide',
		fields: ['ID_Slide','ID_User','Title','SubTitle','Content1','Content2', 'Content3','ID_Slidetemplate'],
		
		relations: {
			'Presentation': dbObject.RELATION_MANY,
			'Slidetemplate': dbObject.RELATION_FOREIGN
		},
		connectors: {
			'Presentation' : 'Presentationslide'
		},
		createStatement: 'CREATE TABLE slides ( ID_Slide INTEGER PRIMARY KEY NOT NULL,  ID_User int(11) NOT NULL,  Title varchar(250) NOT NULL,  SubTitle varchar(1024) NOT NULL,  Content1 mediumtext NOT NULL,  Content2 mediumtext NOT NULL,  Content3 mediumtext NOT NULL,  ID_SlideTemplate int(11) NOT NULL,  lastUpdated timestamp NULL)',
		adapter: 'dbAdapter'
	}, {

	display : function(target) {
		var d = document.createElement('div');
		d.innerHTML = this.get('ID_Slide') + ' - '+ this.get('Title')  + ' - '+ this.get('SubTitle');

		target = target ? document.getElementById(target) : document.body;
		target.appendChild(d);
	}

});