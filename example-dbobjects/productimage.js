Productimage = new Class({
	Implements: [dbObject.Entity],
	dbSetup: {
		className: 'Productimage',
		table: 'products_images',
		primary: 'ID_Product_Image',
		fields: ['ID_Product_Image', 'ID_Product', 'ID_Image'],
		relations: {
			'Product': RELATION_FOREIGN,
			'SBImage': RELATION_FOREIGN
		},
		adapter: 'dbAdapter'
	}
});
