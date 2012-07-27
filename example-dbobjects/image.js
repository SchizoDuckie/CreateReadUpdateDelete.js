SBImage = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'SBImage',
		table: 'images',
		primary: 'ID_Image',
		fields: ['ID_Image', 'name', 'mediumLocation', 'largeLocation', 'tinyLocation', 'description', 'lastUpdated', 'created', 'ID_Client'],
		relations: {
			'Client': RELATION_FOREIGN,
			'Product': RELATION_MANY,
			'Slide': RELATION_MANY
		},
		connectors: {
			'Product': 'Productimage',
			'Slide': 'Slideimage'
		},

		adapter: 'dbAdapter'
	},

	preloadMini: function(container) {
		if(this.getID() == false) return container;
		var imgLocation = 'clientImages/'+this.get('ID_Client')+'/images/';
		
		if(typeof container == 'string') {
			container = new Element('div', {html: container } );
			console.log(container);
		}	

		new Asset.image(imgLocation+this.get('tinyLocation'), {
			title: 'Product image '+this.get('name')
			}).addEvent('load', function(event, el) {
				var el = $(this).getElement('.unloaded');
				if(event.target) {
					if(el) { el.removeClass('unloaded').adopt(
					  event.target.set({ width: '', height:''}).setStyles({ width: '100%', height: ''}).setOpacity(0));
					  event.target.tween('opacity', 1);
				}
			}
		}.bind(container));
		return container;
	},

	/**
	 * Instantiate mteengine template to display this template
	 * @param {Object} parent
	 */
	displayEditor: function(parent) {
		var template = new Template(Template.DefaultImplementation);
		template.from('image-image.editor');
		var container = template.process(this.getValues());	
	
		$$(parent).publishes({
			'click:relay(input.changeimage)': '/image/change/'+this.getID()+'/'+parent,
			'click:relay(input.deleteimage)' : '/image/delete/'+this.getID()+'/'+parent
		});
				
		this.preloadMini(container);
		
		return(container);
	},

	displayPicker: function(parent) {

		var container = new Element('div.image').adopt(new Element('div.productimage.unloaded'));
		this.preloadMini(container);

		container.adopt(new Element('p', {text: this.get('name')}));
		return(container);
	},

	preload: function(container) {
		var imgLocation = 'clientImages/'+this.get('ID_Client')+'/images/';

		new Asset.image(imgLocation+this.get('mediumLocation', this.get('largeLocation')), {
			title: 'Product image '+this.get('name')
			}).addEvent('load', function(event, el) {
				var el = this.getElement('.unloaded');
				if(event.target) {
					if(el) { $(this).getElement('.unloaded').removeClass('unloaded').adopt(
					  event.target.set({ width: '', height:''}).setStyles({ width: '100%', height: ''}).setOpacity(0));
					  event.target.tween('opacity', 1);
				}
			}
		}.bind(container));
	},
		
	// passing containers is annoying. We return a container instead.
	getPreloaded: function() {
		var imgLocation = 'clientImages/'+this.get('ID_Client')+'/images/';
		var targetEl = new Element('div.productimage.unloaded');
		new Asset.image(imgLocation+this.get('mediumLocation', this.get('largeLocation')), {
			title: 'Product image '+this.get('name')
			}).addEvent('load', function(event, el) {
				if(event.target) {
					  this.removeClass('unloaded').adopt(
					   event.target.set({ width: '', height:''}).setStyles({ width: '100%', height: ''}).setOpacity(0)
					  );
					  event.target.tween('opacity', 1);
				}
			
		}.bind(targetEl));
		return targetEl;
	}
});
