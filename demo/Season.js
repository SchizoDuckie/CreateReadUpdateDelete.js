function Season() {
    CRUD.Entity.call(this);
}

CRUD.define(Season, {
    table: 'Seasons',
    primary: 'ID_Season',
    fields: ['ID_Season', 'ID_Serie', 'poster', 'overview', 'seasonnumber', 'ratings', 'ratingcount', 'watched', 'notWatchedCount'],
    relations: {
        'Serie': CRUD.RELATION_FOREIGN,
        'Episode': CRUD.RELATION_FOREIGN
    },
    indexes: [
        'ID_Serie'
    ],
    orderProperty: 'seasonnumber',
    orderDirection: 'DESC',
    createStatement: 'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), overview TEXT NULL, seasonnumber INTEGER, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE )',
    migrations: {
        2: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        3: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL, UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, seasonnumber) select ID_Season, ID_Serie, poster, seasonnumber from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        4: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), seasonnumber INTEGER, overview TEXT NULL, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE)',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount) select ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ],
        5: [
            'ALTER TABLE Seasons RENAME TO Seasons_bak',
            'CREATE TABLE Seasons ( ID_Season INTEGER PRIMARY KEY NOT NULL,ID_Serie INTEGER NOT NULL, poster VARCHAR(255), overview TEXT NULL, seasonnumber INTEGER, ratings INTEGER NULL, ratingcount INTEGER NULL, watched TINYINT DEFAULT(0), notWatchedCount INTEGER DEFAULT(0), UNIQUE (ID_Serie, seasonnumber) ON CONFLICT REPLACE )',
            'INSERT OR IGNORE INTO Seasons (ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched) select ID_Season, ID_Serie, poster, overview, seasonnumber, ratings, ratingcount,watched from Seasons_bak',
            'DROP TABLE Seasons_bak'
        ]
    }
}, {
    getEpisodes: function() {
        return Episode.findByID_Season(this.getID());
    }
});