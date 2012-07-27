Product = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'Product',
		table : 'products',
		primary : 'ID_Product',
		fields: ['ID_Product','ID_Catalog','ID_ProductType','Name','LongDescription','ShortDescription', 'Price','ID_DefaultImage','Inserted', 'lastUpdated'],
		editorFields: {
			'Name': { label: 'Product Naam', placeholder: 'Weergave naam van uw product', type: 'text', validation: 'validate-alphanumeric' },
			'ShortDescription': { label: 'Korte beschrijving', placeholder: 'max. 200 karakters', type: 'text', validation: 'required validate-alphanumeric' },
			'LongDescription': { label: 'Beschrijving', placeholder: 'html toegestaan', type:'textarea' },
			'Price': { label: 'Prijs', type: 'text', placeholder: '0.00', validation: 'price', validation: 'required validate-numeric'}
		},
		relations: {
			'Catalog': RELATION_FOREIGN,
			'Category': RELATION_MANY,
			'RelatedProduct': RELATION_FOREIGN
		},
		connectors: {
			'Category' : 'Categoryproduct'
		},
		adapter: 'dbAdapter'
	},
	
	customProperties: {},

	/**
	 * Populate the customproperties from cache if it's there.
	 */
	getCustomProperties: function() {
		if(window.cachedProducts) {										// match-up the pre-cached data with the products. todo: move this to serverside.
		
			var cached = window.cachedProducts;
		
			var type = parseInt(this.get('ID_ProductType'));							// get the current product type.
			if(cached.producttypes && cached.producttypes[type]) {						// see if it exists
				
				var pt = cached.producttypes[type];										// found the product type. This's been hacked to contain the customProperties:
				console.log("Populating customproperties for product. Cached!");
		
				if(pt) this.databaseValues.Producttype = pt;							// if we find the producttype we hook it up to this product for ease.

				for(var i in pt.properties) {							// then check if we have custom values for this type.
					var pp = pt.properties[i];
					var value= "";

					if(cached.productvalues && cached.productvalues[this.getID()] && cached.productvalues[this.getID()][pp.ID_ProductProperty]) { // now check to see if there's values connected product.(grouped by ID_ProductProperty)
						value = cached.productvalues[this.getID()][pp.ID_ProductProperty].Value;						    // yes! \o/
					}					
					this.customProperties[pt.properties[i]['Property']] = value; // append with value.
				}	
			}
			console.log("Done populating product customProperties: ", this.customProperties);
		}
		return this.customProperties;
	},
	

	refresh: function(newValues) {
		this.product.set('html', this.getContent());
	},


	getContent: function() {
		return ['<div class="prod" style="text-align: left; width: 600px; margin: 0;"><h1>',
		this.get('Name'),'</h1>',
		'<h5>Product Type:', this.get('ID_ProductType'),'</h5>',
		'<p>',this.get('LongDescription'),'</p>',
		'<ul>',
			'<li><strong>Price:</strong>', this.get('Price'), '</li>',
			'<li><strong>Created:</strong>', this.get('Inserted'), '</li>',
			'<li><strong>Last Updated:</strong>', this.get('lastUpdated'), '</li>',
		'</ul></div>'].join('');
	},

	preloadMini: function(container) {
		if(window.cachedProducts && window.cachedProducts.productimages) {
			if (window.cachedProducts.productimages[this.getID()]) {
				this.images = window.cachedProducts.productimages[this.getID()];
				for(i=0; i<this.images.length; i++) {
					var img = new dbObject.fromCache(SBImage, window.cachedProducts.images[this.images[i]]); 
					img.preloadMini(container);
				}
			}
		}
	},

	preloadImages: function(container) {
		
			this.images = [];
			dbObject.Find(SBImage, { Product : { ID : this.getID() } } , {
				onSuccess: function(images) {
					for(var i=0; i<images.length;i++) {
						images[i].preload(container);
					}
					this.images = images;
				}.bind(this),
				onError: function(err) {
					console.warn("Could not preload images: ", err);
				}
			});
		
	},
	
	// todo: refactor to template!

	display: function(displaytype) {
		console.log("Product preview!");
		var element = parseTemplate('product.preview', {
			product: this.databaseValues,
			customProperties: this.getCustomProperties(),
			propertyNames: Hash.getKeys(this.customProperties), 
			displaytype: 'preview',
			editorlink: displaytype == 'edit'
		}); 

		console.log("Parsed tmeplate: ", element);
		$('producteditor').empty().adopt(element);

		
		if(displaytype == 'listitem' || displaytype == 16) {
			this.preloadMini(element);		
		} else {
			this.preloadImages(element);
		}
		
	},


	// displays a preview of a disabled editor with the custom properties append at the bottom.
	displayEditorPreview: function(producttype, customproperties, target) {
		this.editor = new FormGenerator(this, "Voorbeeldweergave", { disabled: true });
		this.editor.setTarget(target.getParent());		
		for(var i=0; i<customproperties.length; i++) {
			this.editor.addField(customproperties[i].getEditorPreview());
		}
		this.editor.display();
	},

	// displays a preview of a disabled editor with the custom properties append at the bottom.
	displayAdder: function(target, customproperties) {
		this.set('ID_Catalog', window.manager.getActiveCatalog());
		this.editor = new FormGenerator(this, "Product Toevoegen");
		this.editor.setTarget(target);
		this.editor.addField(new Element('div').adopt(new Element('input[type=text][name=ID_Category][value='+window.manager.getActiveCategory()+']')), true);
		this.editor.addField(new Element('div').adopt(new Element('input[type=text][name=ID_Catalog][value='+window.manager.getActiveCatalog()+']')), true);
		return this.editor.display();
	},


	// Returns an editor for this product with the custom properties and custom values included.
	displayEditor: function() {
		
		this.editor = new FormGenerator(this, "Product bewerken");
		this.getCustomProperties();
		var productproperties = window.cachedProducts.producttypes[this.get('ID_ProductType')].properties;
		// iterate the found properties here.
		Object.each(productproperties, function(prop) {

			var custprop = dbObject.fromCache(Productproperty, prop);
			try
			{
				this.editor.addField(custprop.getEditor(window.cachedProducts.productvalues[this.getID()][custprop.getID()], custprop.get('Description')),  true);				
			}
			catch (E)
			{
				console.error(E);
			}


			console.log(custprop);

		}, this);
		console.log("Returning editor : ", this.editor.display());
		return this.editor.display();
		
	}

});
