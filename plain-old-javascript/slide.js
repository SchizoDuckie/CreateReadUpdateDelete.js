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
		adapter: 'dbAdapter'
	}, {

	display : function(target) {
		var d = document.createElement('div');
		d.innerHTML = this.get('ID_Slide') + ' - '+ this.get('Title')  + ' - '+ this.get('SubTitle');

		target = target ? document.getElementById(target) : document.body;
		target.appendChild(d);
	}

});