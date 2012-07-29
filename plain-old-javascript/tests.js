// some tests to convert to nice expect suite later

// test insert success with all properties:
var p = new Presentation();
p.set('name', 'test '+new Date().getTime());
p.set('ID_Client', 1);
p.set('template','ImageOnly');
p.set('forceUpdate',1);
p.set('lastUpdated', '2012-07-24 14:16:19');
p.set('lastAccessed', '2012-07-24 14:16:19');
p.set('ID_Catalog', 1);
p.set('ID_Category', 1);
p.set('globalCSS', 'test');
p.set('globalJS', 'test');
p.Save({onComplete: function(res) {
 console.log('done saving new test presentation', res) ;
}});

// test insert, set multiple properties at once with object.
var p = new Presentation();
p.set({
	'name' : 'test '+new Date().getTime(),
	'ID_Client': 1,
	'template':'ImageOnly',
	'forceUpdate':1,
	'lastUpdated': '2012-07-24 14:16:19',
	'lastAccessed': '2012-07-24 14:16:19',
	'ID_Catalog': 1,
	'ID_Category': 1,
	'globalCSS': 'test',
	'globalJS': 'test'
});
p.Save({onComplete: function(res) {
 console.log('done saving new test presentation', res) ;
}});

// test insert success with minimum properties:
var p = new Presentation();
p.set('name', 'test '+new Date().getTime());
p.set('ID_Client', 1);
p.set('template','ImageOnly');
p.set('ID_Catalog', 1);
p.Save({onComplete: function(res) {
 console.log('done saving new test presentation', res) ;
}});

// test insert fails constraint, should show at least error msg in console if no onError
var p = new Presentation();
p.set('name', 'test '+new Date().getTime());
p.set('ID_Client', 1);
p.set('template','ImageOnly');
p.Save({onComplete: function(res) {
 console.log('done saving new test presentation', res) ;
}});

// test insert fails constraint, should exec onError if provided
var p = new Presentation();
p.set('name', 'test '+new Date().getTime());
p.set('ID_Client', 1);
p.set('template','ImageOnly');
p.Save({onComplete: function(res) {
 console.log('done saving new test presentation', res) ;
}, onError: function(e) {
	console.error("callback error from save presenation: ", e);
}});

// test update one value:
// find a presentation with id 42, update it's name, save, exec onSuccess
dbObject.FindOne(Presentation, { ID_Presentation: 42 }, {
	onSuccess: function(res) {
		console.log("Foud pres 42: ", res);
		res.set('name', res.get('name') +'woei_');
		res.Save({ onComplete: function(r) {
			console.log('Saved! ', r);
		}});
	}
});

// test update one value:
// find a presentation with id 42, update it's name, save, exec onSuccess
dbObject.FindOne(Presentation, { ID_Presentation: 42 }, {
	onSuccess: function(res) {
		console.log("Foud pres 42: ", res);
		res.set('name', res.get('name') +'woei_');
		res.set('lastUpdated', new Date().toISOString());
	
		res.Save({ onComplete: function(r) {
			console.log('Saved! ', r);
		}});
	}
});

// test delete on object.
// find an existing row, and call deleteYourself on it.
dbObject.FindOne(Presentation, { ID_Presentation: 46 }, {
	onSuccess: function(res) {
		console.log("Foud pres 46: ", res);
		res.deleteYourself({onComplete: function(r) { console.log("Done!", r); } });
	}
});

// test find relations on instantiated object
// dbObject.Entity.find automatically provides contenxt to the current entity.
// queryBuilder automagically takes this into account and builds a join.
dbObject.FindOne(Presentation, { ID_Presentation: 42 }, {
	onSuccess: function(res) {
		console.log("Foud pres 42: ", res.Find("Slide", {},  { onSuccess: function(r) { console.log("Found "+r.length+" slides related to presentation 42! ", r); } }));

	}
});

// test find presentation 41, find slide slide 167, call presentation.Disconnect(slide)
// PresentatioSlide object should be deleted and onComplete called.
dbObject.FindOne(Presentation, { ID_Presentation: 41 }, { onSuccess: function(pres) {
   dbObject.FindOne(Slide, { ID_Slide: 167 } , { onSuccess: function(slide) {
     pres.Disconnect(slide, { onComplete: function(r) {
          console.log("DELETED connection between presentation 41 and slide 167");
       }
   });
  }});
}});


// test find presentation 41, find slide slide 167, call presentation.Connect(slide)
// PresentatioSlide object should be created, both ID's should be set and onComplete called.
// also, the Presentationslide constraint is met by embedding the defaultValues on insert.
dbObject.FindOne(Presentation, { ID_Presentation: 41 }, { onSuccess: function(pres) {
   dbObject.FindOne(Slide, { ID_Slide: 167 } , { onSuccess: function(slide) {
     pres.Connect(slide, { onComplete: function(r) {
          console.log("CREATED connection between presentation 41 and slide 167");
       }
   });
  }});
}});