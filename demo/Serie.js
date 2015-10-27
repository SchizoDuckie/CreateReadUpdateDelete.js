function Serie() {
    CRUD.Entity.call(this);
}

/**
 * Allow CRUD.js to register itself and the properties defined on each named function.
 */

CRUD.define(Serie, {
    className: 'Serie',
    table: 'Series',
    primary: 'ID_Serie',
    fields: ['ID_Serie', 'name', 'banner', 'overview', 'TVDB_ID', 'IMDB_ID', 'TVRage_ID', 'actors', 'airs_dayofweek', 'airs_time', 'timezone', 'contentrating', 'firstaired', 'genre', 'country', 'language', 'network', 'rating', 'ratingcount', 'runtime', 'status', 'added', 'addedby', 'fanart', 'poster', 'lastupdated', 'lastfetched', 'nextupdate', 'displaycalendar', 'autoDownload', 'customSearchString', 'watched', 'notWatchedCount'],
    relations: {
        'Episode': CRUD.RELATION_FOREIGN,
        'Season': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'fanart',
    ],
    createStatement: 'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0) )',
    defaultValues: {

    },
    fixtures: [

    ],
    migrations: {
        5: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), networkid VARCHAR(50) DEFAULT(NULL), seriesid VARCHAR(50) DEFAULT(NULL), zap2it_id VARCHAR(50) DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, networkid, seriesid, zap2it_id, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ],
        6: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, contentrating, firstaired, genre, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate from Series_bak',
            'DROP TABLE Series_bak'
        ],
        7: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar from Series_bak',
            'DROP TABLE Series_bak'
        ],
        8: [
            'ALTER TABLE Series RENAME TO Series_bak',
            'CREATE TABLE Series (ID_Serie INTEGER PRIMARY KEY NOT NULL, name VARCHAR(250) DEFAULT(NULL), banner VARCHAR(1024) DEFAULT(NULL), overview TEXT DEFAULT(NULL), TVDB_ID INTEGER UNIQUE NOT NULL, IMDB_ID INTEGER DEFAULT(NULL), TVRage_ID INTEGER DEFAULT(NULL), actors VARCHAR(1024) DEFAULT(NULL), airs_dayofweek VARCHAR(10) DEFAULT(NULL), airs_time VARCHAR(15) DEFAULT(NULL), timezone VARCHAR(30) DEFAULT(NULL), contentrating VARCHAR(20) DEFAULT(NULL), firstaired DATE DEFAULT(NULL), genre VARCHAR(50) DEFAULT(NULL), country VARCHAR(50) DEFAULT(NULL), language VARCHAR(50) DEFAULT(NULL), network VARCHAR(50) DEFAULT(NULL), rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), runtime INTEGER DEFAULT(NULL), status VARCHAR(50) DEFAULT(NULL), added DATE DEFAULT(NULL), addedby VARCHAR(50) DEFAULT(NULL), fanart VARCHAR(150) DEFAULT(NULL), poster VARCHAR(150) DEFAULT(NULL), lastupdated TIMESTAMP DEFAULT (NULL), lastfetched TIMESTAMP DEFAULT (NULL), nextupdate TIMESTAMP DEFAULT (NULL), displaycalendar TINYINT DEFAULT(1), autoDownload TINYINT DEFAULT(1), customSearchString VARCHAR(150) DEFAULT(NULL), watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0) )',
            'INSERT OR IGNORE INTO Series (ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched) select ID_Serie, name, banner, overview, TVDB_ID, IMDB_ID, TVRage_ID, actors, airs_dayofweek, airs_time, timezone, contentrating, firstaired, genre, country, language, network, rating, ratingcount, runtime, status, added, addedby, fanart, poster, lastupdated, lastfetched, nextupdate, displaycalendar, autoDownload, customSearchString, watched from Series_bak',
            'DROP TABLE Series_bak'
        ]
    }
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

    /** 
     * Fetch episodes as object mapped by TVDB_ID
     */
    getEpisodesMap: function() {
        return this.getEpisodes().then(function(result) {
            var out = {};
            result.map(function(episode) {
                out[episode.TVDB_ID] = episode;
            });
            return out;
        });
    },

    getSeasonsByNumber: function() {
        return this.getSeasons().then(function(seasons) {
            var out = {};
            seasons.map(function(el) {
                out[el.seasonnumber] = el;
            });
            return out;
        });
    },

    getLatestSeason: function() {
        return Season.findOneByID_Serie(this.getID());
    },

    getActiveSeason: function() {
        var firstAiredFilter = {
            Episode: ['firstaired < ' + new Date().getTime()]
        };
        var self = this;

        firstAiredFilter.Episode.ID_Serie = this.getID();
        return CRUD.FindOne('Season', firstAiredFilter, {
            orderBy: 'ID_Season desc'
        }).then(function(result) {
            return result ? result : self.getLatestSeason().then(function(result) {
                return result;
            });
        });
    },

    getSortName: function() {
        if (!this.sortName) {
            this.sortName = this.name.replace('The ', '');
        }
        return this.sortName;

    },

    getNextEpisode: function() {
        var filter = ['(Episodes.ID_Serie = ' + this.getID() + ' AND Episodes.firstaired > ' + new Date().getTime() + ') or (Episodes.ID_Serie = ' + this.getID() + ' AND  Episodes.firstaired = 0)'];
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber asc, firstaired asc'
        }).then(function(result) {
            return result;
        });
    },

    getLastEpisode: function() {
        var filter = ['(Episodes.firstaired > 0 and Episodes.firstAired < ' + new Date().getTime() + ')'];
        filter.ID_Serie = this.getID();
        return CRUD.FindOne('Episode', filter, {
            orderBy: 'seasonnumber desc, episodenumber desc, firstaired desc'
        }).then(function(result) {
            return result;
        });
    },
    toggleAutoDownload: function() {
        this.autoDownload = this.autoDownload == '1' ? '0' : '1';
        this.Persist();
    }
});