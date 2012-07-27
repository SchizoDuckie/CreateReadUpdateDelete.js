Slidetemplate = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'Slidetemplate',
		table : 'slidetemplates',
		primary : 'ID_Slidetemplate',
		fields: ['ID_Slidetemplate','Name','Icon','nTargets'],
		editorFields: {
			'Name': { label: 'name', placeholder: 'SlideTPL Name', type: 'text', validation: 'validate-alphanumeric' }
		},
		relations: {
			'Slide': RELATION_FOREIGN
		},
		connectors: {
		},
		adapter: 'dbAdapter'
	},

	display: function() {
		return new Element("div", {html: "Slide: "+this.get('Name') });
	},

	displayNameEditor: function(target, id) {
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
	},

	nameSaved: function(target, id) {
		console.warn("Saved name for ", target, "< ", this.get('Content' + id));
		$(target.id).set('html', this.get('Content' + id));

	}

});
