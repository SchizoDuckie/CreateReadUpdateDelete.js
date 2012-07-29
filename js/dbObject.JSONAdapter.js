dbObject.RemoteAdapter = new Class({
		Implements: [dbObject.ConnectionAdapter],
		endpoint: './dbobject/',
		options: {}
});

dbObject.JSONAdapter = new Class({
	Implements: [dbObject.RemoteAdapter],
	bound: {},
	activeRequests: {},
			
	initialize:function(endpoint, options) {
		this.endpoint = endpoint;
		this.setOptions(options);

		this.transport = Request.JSON;
		console.info('Created dbObject.JSONAdapter for endpoint: ', endpoint);
	},

	onLoadStart: function (event, xhr) {
		//console.info("[JSON] Started load!", event, this);
	},
	
	onProgress: function(event, xhr) {
		//console.info("[JSON] Load progress!", event, this);
	},

	onComplete: function(event, xhr) {
		//console.info("[JSON] Load complete!", event, this);
	},

	onSuccess: function(result, responseText, options) {
		console.info("[JSON] Request completed: ", result);
		var output = [];
		for(i=0; i<result.length; i++) {
			var obj = new window[result.What]();
			obj.importValues(result.Result[i]);
			obj.dbSetup.adapter = this;
			output.push(obj);
		}
		if(options.limit && options.limit==1 && output.length == 1) output = output[0];
		options.onSuccess(output);
	},

	onError: function(text, error) {
		console.error("[JSON] ERROR!!!", error, text);
		this.error(text, error);
	},

	Find: function(what, filters, sorting, justthese, options) {
		console.info("[JSON] Find Request!", what, filters, options, this.endpoint);
		$(document.body).addClass('wait');
		requestOptions= { 'what': what, 'filters': filters, 'sorting': sorting, 'justthese': justthese };
		var bound = {
			onLoadStart : this.onLoadStart.bind(this),
			onProgress : this.onProgress.bind(this),
			onComplete: function(a,b) {
				this.onSuccess(a,b, options);
			}.bind(this),
			onError: this.onError.bind(this)			
		}
		new this.transport({url: this.endpoint}).addEvents(bound).send({data: requestOptions});
	},

	Save: function(what, callbacks) {
		var newData = {}, oldData = {}, customProperties = {};

		var out = {
			what: what.getType(),
			ID: what.getID(),
			oldData: {},
			newData: {}
		}
		
		// copy only registered properties.
		for(var i = 0; i< what.dbSetup.fields.length; i++) {
			var prop = what.dbSetup.fields[i];
			out.oldData[prop] = what.databaseValues[prop];
			if(what.changedValues[prop]) out.newData[prop] = what.changedValues[prop];
		}

		// check for additional registered properties and send them along in customData
		if(what.customProperties.length > 0) {
			out.customData  = {};
			for(var i= 0; i< what.customProperties.length; i++) {
				var prop = what.customProperties[i];
				if(what.customData[prop]) {
					out.customData[prop] = what.customData[prop];
				}
			}
		}
		console.warn("Sending over the wire: ", out);
		new this.transport({ url: this.endpoint+'save/'}).addEvents( {
				onRequest: callbacks.onStart || function() {}, 
				onComplete: callbacks.onComplete || function() {},
				onError: callbacks.onError || function() {}				
			})
			.send({ data: out });

	},

	Delete: function(what, callbacks) {
		console.info("Delete dbobject with json adapter! ", what, callbacks);
		new this.transport({ url: this.endpoint+'delete/'}).addEvents( {
				onRequest: callbacks.onStart || function() {}, 
				onComplete: callbacks.onComplete || function() {},
				onError: callbacks.onError || function() {}				
			})
			.send({ data: {
				what: what.getType(),
				ID: what.getID(),
				newData: what.changedValues, 
				oldData: what.databaseValues
			}});

	}	
});