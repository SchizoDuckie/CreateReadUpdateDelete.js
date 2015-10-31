/**
 * Create a nice Native function so that we can do console.log and see a Serie object
 */
function Serie() {
    CRUD.Entity.call(this);
}

/**
 * Extend the Named Function with CRUD definitions and register it in the CRUD.EntityManager
 * Signature:
 * CRUD.Define(Entity, {options}, {prototypeMethods});
 */
CRUD.define(Serie, {
    table: 'Series', // Database table this entity is bound to
    primary: 'ID_Serie', // Primary key. Make sure to use uniquely named keys, don't use 'id' on every table and refer to 'id_something'
    fields: [ // List all individual properties. Accessors will be auto-created (but can be overwritten)
        'ID_Serie',
        'name',
        'banner',
        'overview',
        'TVDB_ID',
        'actors'
    ],
    autoSerialize: ['actors'], // optional array of properties that will be json_encoded / decoded automagically.
    relations: {
        // Foreign keys will be matched automagically based on the primary key of this table
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN,
        // Many to many relations have a connecting CRUD entity that has a foreign key to both this primary and the foreign primary.
        'Tag': CRUD.RELATION_MANY
    },
    indexes: [
        'name', // A create index statement will be automagically run to add any columns you list here
    ],
    // Provide your CREATE TABLE statement. CreateReadUpdateDelete will not autogenerate this for you
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, actors VARCHAR(1024) DEFAULT(NULL))',
    defaultValues: { // You can create a map of default values that you don't have in your schema here 
        'actors': ['Some actor']
    },
    fixtures: [{ // Fixtures can be an optional array of objects that are inserted when the table is created
        name: 'Marvels Agents of S.H.I.E.L.D',
        TVDB_ID: 263365,
        // since actors is an autoSerialized field, you should supply the pre-json-encoded field format for fixtures
        actors: '["Clark Gregg (Phil Coulson)","Ming-Na Wen (Melinda May / Agent 33)","Brett Dalton (Grant Ward)","Chloe Bennet (Skye)","Iain De Caestecker (Leo Fitz)"]'
    }]
}, {
    getEpisodes: function() {
        return Episode.findBySerie({
            ID_Serie: this.getID()
        }, {
            limit: 100000
        });
    },

    getSeasons: function() {
        return Season.findByID_Serie(this.getID());
    },

    getLastEpisode: function() {
        var filter = ['(Episodes.firstaired > 0 and Episodes.firstAired < ' + new Date().getTime() + ')'];
        filter.ID_Serie = this.getID();
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber desc, firstaired desc'
        }).then(function(result) {
            return result;
        });
    }
});