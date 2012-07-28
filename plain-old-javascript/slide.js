var Slide = new dbObject.Entity({
		className: 'Slide',
		table : 'slides',
		primary : 'ID_Slide',
		fields: ['ID_Slide','ID_User','Title','SubTitle','Content1','Content2', 'Content3','ID_Slidetemplate'],
		editorFields: {
			'Content1': { label: 'Content1', placeholder: 'Content 1 inhoud', type: 'text', validation: 'validate-alphanumeric' },
			'Content2': { label: 'Content2', placeholder: 'Content 2 inhoud', type: 'text', validation: 'validate-alphanumeric' },
			'Content3': { label: 'Content3', placeholder: 'Content 3 inhoud', type: 'text', validation: 'validate-alphanumeric' }
		},
		relations: {
			'Presentation': dbObject.RELATION_FOREIGN,
			'Slidetemplate': dbObject.RELATION_FOREIGN
		},
		connectors: {
			'Presentation' : 'Presentationslide'
		},
		adapter: 'dbAdapter'
});

Slide.prototype.display = function() {
	return new Element("div", {html: "Slide: "+this.get('Name') });
};

Slide.displayNameEditor = function(target, id) {
	this.element = $(target);
	$(target).getFirst().dissolve();
	console.log("generating new editor for Content"+id);
	this.editor = new FormGenerator(this, false, { justThese: ['Content' + id]}).addEvents({
			'saved': this.nameSaved.pass([target, id], this),
			'cancel': function() { this.element.getFirst().reveal(); }.bind(this)
	});

	this.formcontainer = new Element('div').inject(target);
	this.form = this.formcontainer.adopt(this.editor.display());
	this.form.set('reveal', { transition: 'bounce:out'});
	this.form.hide().reveal(); // show form
};

Slide.nameSaved = function(target, id) {
	console.warn("Saved name for ", target, "< ", this.get('Content' + id));
	$(target.id).set('html', this.get('Content' + id));
};

