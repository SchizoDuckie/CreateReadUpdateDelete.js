var Scaffold = new Class({
	analyzer: false,

	initialize: function() {
		$('gen').addEvent('click', function() {
				this.analyzer = new DatabaseAnalyzer($('db').get('value'), {
					'onAnalyzed' : this.showSchema.bind(this)
			});
		}.bind(this));
	},

	showSchema: function(virtuals, analyzer) {
		console.log("Parsed schema into object", virtuals);
		var generatedText = $('generated');
		Object.each(virtuals, function(obj, key) {
			generatedText.value += "\n\n/*\n * "+obj.getName()+"\n */\n"+obj.createClass();
			document.body.appendChild(new Element('pre', { 'class': "brush: js; ruler: true;", text: obj.createClass() }));
			
		});

		 SyntaxHighlighter.all();

	}

});

