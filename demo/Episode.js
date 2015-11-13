function Episode() {
    CRUD.Entity.call(this);
}


CRUD.define(Episode, {
    table: 'Episodes',
    primary: 'ID_Episode',
    fields: ['ID_Episode', 'ID_Serie', 'ID_Season', 'TVDB_ID', 'episodename', 'episodenumber', 'seasonnumber', 'firstaired', 'firstaired_iso', 'IMDB_ID', 'language', 'overview', 'rating', 'ratingcount', 'filename', 'images', 'watched', 'watchedAt', 'downloaded', 'magnetHash', 'TRAKT_ID'],
    autoSerialize: ['images'],
    relations: { Serie: 'CRUD.',
  Season: 'CRUD.',
  Actor: CRUD.RELATION_FOREIGN },
    createStatement: 'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER DEFAULT NULL )',
    defaultValues: {
        watched: 0
    },
    indexes: [
        'watched',
        'TVDB_ID',
        'ID_Serie, firstaired',
        'ID_Season'
    ],
    migrations: {
        8: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , firstaired TIMESTAMP , imdb_id VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL) , seasonnumber INTEGER NULL , filename VARCHAR(255) , lastupdated TIMESTAMP , seasonid INTEGER NULL , seriesid INTEGER NULL , lastchecked TIMESTAMP NULL, watched VARCHAR(1), watchedAt TIMESTAMP NULL, magnetHash VARCHAR(40) NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, firstaired, imdb_id, language, overview, rating, ratingcount, seasonnumber, filename, lastupdated, seasonid, seriesid, lastchecked, watched, watchedAt, magnetHash from Episodes_bak',
            'DROP TABLE Episodes_bak'
        ],
        9: [
            'UPDATE Episodes set watched = "1" where watched = 1.0'
        ],
        10: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL , firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, watched, watchedAt, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, coalesce(watched,0), watchedAt, magnetHash from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ],
        11: [
            'ALTER TABLE Episodes RENAME TO Episodes_bak',
            'CREATE TABLE Episodes ( ID_Episode INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, ID_Season INTEGER NULL, TVDB_ID INTEGER UNIQUE, episodename VARCHAR(255), episodenumber INTEGER , seasonnumber INTEGER NULL ,firstaired TIMESTAMP, firstaired_iso varchar(25), IMDB_ID VARCHAR(20), language VARCHAR(3), overview TEXT default NULL, rating INTEGER DEFAULT(NULL), ratingcount INTEGER DEFAULT(NULL), filename VARCHAR(255) , images TEXT, watched INTEGER DEFAULT 0, watchedAt TIMESTAMP NULL, downloaded INTEGER DEFAULT 0, magnetHash VARCHAR(40) NULL, TRAKT_ID INTEGER NULL )',
            'INSERT OR IGNORE INTO Episodes (ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, IMDB_ID, language, overview, rating, ratingcount, filename, images, watched, watchedAt, downloaded, magnetHash) select ID_Episode, ID_Serie, ID_Season, TVDB_ID, episodename, episodenumber, seasonnumber, firstaired, imdb_id, language, overview, rating, ratingcount, filename, images, coalesce(watched,0), watchedAt, downloaded, magnetHash from Episodes_bak;',
            'DROP TABLE Episodes_bak'
        ]
    }
}, {
    watched: {
        get: function() {
            //console.log("accessor override");
            return parseInt(this.get('watched'));
        }
    },
    getSeason: function() {
        return this.FindOne('Season');
    },
    getFormattedEpisode: function() {
        return this.formatEpisode(this.seasonnumber, this.episodenumber);
    },

    formatEpisode: function(season, episode) {
        var sn = season.toString(),
            en = episode.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
        return out;
    },

    getAirDate: function() {
        return this.firstaired === 0 ? '?' : new Date(this.firstaired).toLocaleString();
    },
    getAirTime: function() {
        return new Date(this.firstaired).toTimeString().substring(0, 5);
    },
    hasAired: function() {
        return this.firstaired && this.firstaired !== 0 && this.firstaired <= new Date().getTime();
    },
    isWatched: function() {
        return this.watched && parseInt(this.watched) == 1;
    }
});