/**
 * CRUD.SQliteAdapter
 * ------------------
 *
 * WebSQL adapter for CreateReadUpdateDelete.js
 * (Currently the only one available)
 *
 * This is called from CRUD.setAdapter()
 * @see CRUD.setAdapter
 * @param {string} database Database Name
 * @param {object} dbOptions options to pass to window.openDatabase.
 */
CRUD.SQLiteAdapter = function(database, dbOptions) {
    this.databaseName = database;
    this.dbOptions = dbOptions;
    this.lastQuery = false;
    this.initializing = true;
    CRUD.ConnectionAdapter.apply(this, arguments);
    var db;
    var self = this;

    /**
     * Create a new CRUD.Database instance that opens the database, make sure all tables and indexes exist and create them if they don't
     */
    this.Init = function() {
        this.db = db = new CRUD.Database(self.databaseName);
        return db.connect().then(function() {
            CRUD.log("SQLITE connection created to ", self.databaseName);
            return verifyTables().then(function() {
                self.initializing = false;
            });
        });
    };

    /**
     * Generic update query callback that logs writesExecuted and sets update action.
     * @param  {resultSet} resultSet resulting from an update query.
     * @return {resultSet} enriched resultSet with Action executed.
     */
    function updateQuerySuccess(resultSet) {
        CRUD.stats.writesExecuted++;
        resultSet.Action = 'updated';
        return resultSet;
    }

    /**
     * Generic update query error callback that logs writesExecuted and the error.
     * @param  {Error} err WebSQL error
     * @param  {Transaction} tx WebSQL Transaction
     * @return {void}
     */
    function updateQueryError(err, tx) {
        console.error("Update query error!", err);
        CRUD.stats.writesExecuted++;
        return;
    }

    /**
     * Generic insert query callback that logs writesExecuted and sets inserted action + id
     * @param  {resultSet} resultSet resulting from an insert query.
     * @return {resultSet} enriched resultSet with Action executed and ID property
     */
    function insertQuerySuccess(resultSet) {
        resultSet.Action = 'inserted';
        resultSet.ID = resultSet.rs.insertId;
        CRUD.stats.writesExecuted++;
        return resultSet;
    }

    /**
     * Generic insert query error callback that logs writesExecuted and the error.
     * @param  {Error} err WebSQL error
     * @param  {Transaction} tx WebSQL Transaction
     * @return {error}
     */
    function insertQueryError(err, tx) {
        CRUD.stats.writesExecuted++;
        console.error("Insert query error: ", err);
        return err;
    }

    /**
     * Verify that all tables for registered entities exist.
     * This starts a promise chain that executes the following steps:
     * - Fetch a list of all tables and indexes
     * - Iterate all known entities and:
     * - Execute their createStatements if they haven't been created.
     * - Execute any migrations in sequence if the localStorage value database.version.<table> is smaller than the highest migration number
     * - Compare the list of indexes and create the ones that don't exist
     * - Insert fixtures if the table has been freshly created
     * @return {Promise} Promise that resolves when all initialization is done
     */
    function verifyTables() {
        CRUD.log('verifying that tables exist');
        var tables = [],
            indexes = {};

        /**
         * Pre-Parse database schema info for further processing. Finds tables and indexes.
         * @param  {resultSet} database description
         * @return {void} void
         */
        function parseSchemaInfo(resultset) {
            for (var i = 0; i < resultset.rs.rows.length; i++) {
                var row = resultset.rs.rows.item(i);
                if (row.name.indexOf('sqlite_autoindex') > -1 || row.name == '__WebKitDatabaseInfoTable__') continue;
                if (row.type == 'table') {
                    tables.push(row.tbl_name);
                } else if (row.type == 'index') {
                    if (!(row.tbl_name in indexes)) {
                        indexes[row.tbl_name] = [];
                    }
                    indexes[row.tbl_name].push(row.name);
                }
            }
            return;
        }

        /**
         * Iterate the list of registered entities and creates their tables if they don't exist.
         * Run the migrations when needed if the table version is out of sync
         * @return {void} void
         */
        function createTables() {
            return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                var entity = CRUD.EntityManager.entities[entityName];
                if (tables.indexOf(entity.table) == -1) {
                    if (!entity.createStatement) {
                        throw "No create statement found for " + entity.getType() + ". Don't know how to create table.";
                    }
                    return db.execute(entity.createStatement).then(function() {
                        tables.push(entity.table);
                        localStorage.setItem('database.version.' + entity.table, ('migrations' in entity) ? Math.max.apply(Math, Object.keys(entity.migrations)) : 1);
                        CRUD.log(entity.getType() + " table created.");
                        return entity;
                    }, function(err) {
                        CRUD.log("Error creating " + entity.getType(), err);
                        throw "Error creating table: " + entity.table + " for " + entity.getType();
                    }).then(createFixtures).then(function() {
                        CRUD.log("Table created and fixtures inserted for ", entity.getType());
                        return;
                    });
                }
                return;
            }));
        }

        /**
         * Run migrations for a table if the version stored in localStorage is out of sync.
         * All tables created by CreateReadUpdateDelete.js are versioned this way.
         * For more info on migrations see the docs.
         * @return {void} void
         */
        function runMigrations() {
            return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                var entity = CRUD.EntityManager.entities[entityName];
                if (entity.migrations) {
                    var currentVersion = !localStorage.getItem('database.version.' + entity.table) ? 1 : parseInt(localStorage.getItem('database.version.' + entity.table), 10);
                    if (isNaN(currentVersion)) {
                        currentVersion = 1;
                    }
                    var highestVersion = Math.max.apply(Math, Object.keys(entity.migrations));
                    if (currentVersion == highestVersion) return;
                    return Promise.all(Object.keys(entity.migrations).map(function(version) {
                        if (parseInt(version) > currentVersion) {
                            return Promise.all(entity.migrations[version].map(function(migration) {
                                CRUD.log('Executing migration: ', migration);
                                return db.execute(migration).then(function(result) {
                                    CRUD.log("Migration success!", result);
                                    return true;
                                }, function(err) {
                                    throw "Migration " + version + " failed for entity " + entityName;
                                });
                            })).then(function() {
                                CRUD.log("All migrations executed for version ", version);
                                localStorage.setItem('database.version.' + entity.table, version);
                                return true;
                            });
                        }
                        return true;
                    }));
                }
            }));
        }

        /**
         * Iterate the list of existing and non-existing indexes for each entity and create the ones that don't exist.
         * @return {void} void
         */
        function createIndexes() {
            // create listed indexes if they don't already exist.
            return Promise.all(Object.keys(CRUD.EntityManager.entities).map(function(entityName) {
                var entity = CRUD.EntityManager.entities[entityName];
                if (('indexes' in entity)) {
                    return Promise.all(entity.indexes.map(function(index) {
                        var indexName = index.replace(/\W/g, '') + '_idx';
                        if (!(entity.table in indexes) || indexes[entity.table].indexOf(indexName) == -1) {
                            return db.execute("create index if not exists " + indexName + " on " + entity.table + " (" + index + ")").then(function(result) {
                                CRUD.log("index created: ", entity.table, index, indexName);
                                if (!(entity.table in indexes)) {
                                    indexes[entity.table] = [];
                                }
                                indexes[entity.table].push(indexName);
                                return;
                            });
                        }
                        return;
                    }));
                }
            }));
        }

        // fetch schema info and perform setup sequence.
        return db.execute("select type,name,tbl_name from sqlite_master")
            .then(parseSchemaInfo)
            .then(createTables)
            .then(runMigrations)
            .then(createIndexes).then(function(result) {
                CRUD.log("All migrations are done!");
                self.initializing = false;
            });
    }

    /**
     * Insert fixtures for an entity if they exist
     * @param {CRUD.Entity} entity entity to insert fixtures for
     * @return {Promise} that resolves when all fixtures were inserted or immediately when none are defined
     */
    function createFixtures(entity) {
        return new Promise(function(resolve, reject) {
            if (!entity.fixtures) return resolve();
            return Promise.all(entity.fixtures.map(function(fixture) {
                CRUD.fromCache(entity.getType(), fixture).Persist(true);
            })).then(resolve, reject);
        });
    }

    /**
     * Non-blocking delay function that waits for execution until all initialization is done
     * This places all calls to CRUD.Find in a setTimeout loop until the tables are created and fixtures are inserted.
     * When setup is done, the callback is executed immediately.
     * @param {callback} to run when setup is done
     * @return {void}
     */
    function delayUntilSetupDone(func) {
        if (!self.initializing) {
            return func();
        } else {
            setTimeout(delayUntilSetupDone, 50, func);
        }
    }

    /**
     * @param {CRUD.Entity} what type of CRUD.Entity to query the database for
     * @param {object} filters Properties to create a WHERE statement from
     * @param {object} options Optional array of options: { orderBy, groupBy, limit, justthese }
     */
    this.Find = function(what, filters, options) {
        var builder = new CRUD.Database.SQLBuilder(what, filters, options);
        var query = builder.buildQuery();

        CRUD.log("Executing query via sqliteadapter: ", options, query);
        return new Promise(function(resolve, fail) {
            return delayUntilSetupDone(function() {
                db.execute(query.query, query.parameters).then(function(resultset) {
                        var output = [];
                        for (var i = 0; i < resultset.rs.rows.length; i++) {
                            output.push(resultset.rs.rows.item(i));
                        }
                        resolve(output);
                    },
                    function(resultSet, sqlError) {
                        CRUD.log('SQL Error in FIND : ', sqlError, resultSet, query);
                        fail();
                    });
            });
        });
    };

    /**
     * Save a changed or new entity into the database.
     * @param {CRUD.Entity} what an instance of a CRUD.Entity
     * @param {boolean} forceInsert (Optional) Flag all values dirty and append them to the query
     * @param {string} mode (Optional) insert mode to use with forceInsert: Default: INSERT. Can also be REPLACE
     */
    this.Persist = function(what, forceInsert, mode) {
        CRUD.stats.writesQueued++;
        mode = mode || 'INSERT';
        var query = [],
            values = [],
            valmap = [],
            names = [];

        function mapValues(field) {
            names.push(field);
            values.push('?');
            valmap.push(what.__dirtyValues__[field]);
        }

        function mapChangedValues(field) {
            if (!(field in what.__dirtyValues__) && !(field in what.__values__)) {
                names.push(field);
                values.push('?');
                valmap.push(CRUD.EntityManager.entities[what.getType()].defaultValues[field]);
            }
        }

        function mapAutoSerialize(field) {
            if (names.indexOf(field) > -1) {
                valmap[names.indexOf(field)] = JSON.stringify(valmap[names.indexOf(field)]);
            }
        }

        // iterate all fields changed 
        Object.keys(what.__dirtyValues__).map(mapValues);
        // add defaults
        Object.keys(CRUD.EntityManager.entities[what.getType()].defaultValues).map(mapChangedValues);

        // json_encode any fields that are defined as needing serializing
        CRUD.EntityManager.entities[what.getType()].autoSerialize.map(mapAutoSerialize);

        if (what.getID() === false || undefined === what.getID() || forceInsert) { // new object : insert.
            // insert
            query.push(mode + ' INTO ', CRUD.EntityManager.entities[what.getType()].table, '(', names.join(","), ') VALUES (', values.join(","), ');');
            CRUD.log(query.join(' '), valmap);
            return db.execute(query.join(' '), valmap).then(insertQuerySuccess, insertQueryError);
        } else { // existing : build an update query.
            query.push('UPDATE', CRUD.EntityManager.entities[what.getType()].table, 'SET', names.map(function(name) {
                return name + ' = ?';
            }).join(','));
            valmap.push(what.getID());
            query.push('WHERE', CRUD.EntityManager.getPrimary(what.getType()), '= ?');

            return db.execute(query.join(' '), valmap).then(updateQuerySuccess, updateQueryError);
        }
    };

    /**
     * @param {CRUD.Entity} what Entity instance to delete
     * @return {Promise} Promise that resolves when done
     */
    this.Delete = function(what) {
        if (what.getID() !== false) {
            query = ['delete from', CRUD.EntityManager.entities[what.getType()].table, 'where', CRUD.EntityManager.getPrimary(what.getType()), '= ?'].join(' ');
            return db.execute(query, [what.getID()]).then(function(resultSet) {
                resultSet.Action = 'deleted';
                return resultSet;
            }, function(e) {
                CRUD.log("error deleting element from db: ", e);
                throw e;
            });
        } else {
            return false;
        }
    };

    return this;
};


/**
 * A Handy Shorthand function to execute a raw SQL query and return the result with a promise.
 *
 * @param  {string} query Query to execute. Optionally use bound parameters with ? as a placeholder.
 * @param  {array} bindings Optional array with query for the query
 * @return {Promise} promise that resolves when query was executed
 */
CRUD.executeQuery = function(query, bindings) {
    return CRUD.EntityManager.getAdapter().db.execute(query, bindings || []);
};


/*
---

CRUD.Database.js, a simple database abstraction layer.
Adapted from mootools Database.js by  Dipl.-Ing. (FH) AndrÃ© Fiedler <kontakt@visualdrugs.net>
Removed all moo dependencies and converted to POJS
December 2013: Updated for use of promises.
...
*/
CRUD.Database = function(name, options) {
    options = options || {
        version: '1.0',
        estimatedSize: 655360
    };

    var lastInsertRowId = 0;
    var db = false;
    var dbName = name || false;

    this.lastInsertId = function() {
        return lastInsertRowId;
    };

    this.close = function() {
        return db.close();
    };

    this.getDB = function() {
        return db;
    };

    var queryQueue = [];

    /** 
     * Execute a db query and promise a resultset.
     * Queries are queue up based upon if they are insert or select queries.
     * selects get highest priority to not lock the UI when batch inserts or updates
     * are happening.
     */
    this.execute = function(sql, valueBindings) {
        if (!db) return;
        return new Promise(function(resolve, fail) {
            queryQueue[sql.indexOf('SELECT') === 0 ? 'unshift' : 'push']({
                sql: sql,
                valueBindings: valueBindings,
                resolve: resolve,
                fail: fail
            });
            setTimeout(processQueue, 10);
        });
    };

    function processQueue() {
        if (queryQueue.length > 0) {
            db.transaction(function(transaction) {
                var localQueue = queryQueue.splice(0, 25);
                if (localQueue.length === 0) return;
                localQueue.map(function(query) {

                    function sqlOK(transaction, rs) {
                        query.resolve(new CRUD.Database.ResultSet(rs));
                    }

                    function sqlFail(transaction, error) {
                        CRUD.log("SQL FAIL!!", error, transaction);
                        query.fail(error, transaction);
                    }
                    transaction.executeSql(query.sql, query.valueBindings, sqlOK, sqlFail);
                    if (CRUD.DEBUG) {
                        CRUD.log(query.sql, query.valueBindings);
                    }
                });
            });
        }
    }

    this.connect = function() {
        return new Promise(function(resolve, fail) {
            try {
                db = openDatabase(dbName, options.version, '', options.estimatedSize);
                if (!db) {
                    fail("could not open database " + dbName);
                } else {
                    CRUD.log("DB connection to ", dbName, " opened!");
                    resolve(this);
                }
            } catch (E) {
                CRUD.log("DB ERROR " + E.toString());
                fail('ERROR!' + E.toString(), E);
            }
        });
    };
};

CRUD.Database.ResultSet = function(rs) {
    this.rs = rs;
    this.index = 0;
    return this;
};

CRUD.Database.ResultSet.prototype.next = function() {
    var row = null;
    if (this.index < this.rs.rows.length) {
        row = new CRUD.Database.ResultSet.Row(this.rs.rows.item(this.index++));
    }
    return row;
};

CRUD.Database.ResultSet.Row = function(row) {
    this.row = row;
    return this;
};

CRUD.Database.ResultSet.Row.prototype.get = function(index, defaultValue) {
    var col = this.row[index];
    return (col) ? col : defaultValue;
};

/**
 * My own query builder, ported from PHP to JS.
 * Should still be refactored and prettified, but works pretty nice so far.
 */
CRUD.Database.SQLBuilder = function(entity, filters, options) {
    this.entity = entity instanceof CRUD.Entity ? entity.getType() : entity;
    this.entityConfig = CRUD.EntityManager.entities[this.entity];
    this.filters = filters || {};
    this.options = options || {};
    this.justthese = [];
    this.wheres = [];
    this.joins = [];
    this.fields = [];
    this.orders = [];
    this.groups = [];
    this.parameters = []; // parameters to bind to sql query.

    Object.keys(this.filters).map(function(key) {
        this.buildFilters(key, this.filters[key], this.entity);
    }, this);

    if (this.options.orderBy) {
        this.orders.push(this.prefixFieldNames(this.options.orderBy.replace('ORDER BY', '')));
    } else {
        if (this.entityConfig.orderProperty && this.entityConfig.orderDirection && this.orders.length === 0) {
            this.orders.push(this.getFieldName(this.entityConfig.orderProperty) + " " + this.entityConfig.orderDirection);
        }
    }

    if (this.options.groupBy) {
        this.groups.push(this.options.groupBy.replace('GROUP BY', ''));
    }

    this.limit = this.options.limit ? 'LIMIT ' + options.limit : 'LIMIT 0,1000';

    (this.options.justthese || CRUD.EntityManager.entities[this.entity].fields).map(function(field) {
        this.fields.push(this.getFieldName(field));
    }, this);
};


CRUD.Database.SQLBuilder.prototype = {

    getFieldName: function(field, table) {
        return (table || this.entityConfig.table) + '.' + field;
    },

    prefixFieldNames: function(text) {
        var fields = text.split(',');
        return fields.map(function(field) {
            var f = field.trim().split(' ');
            var direction = f[1].toUpperCase().match(/(ASC|DESC)/)[0];
            field = f[0];
            if (this.entityConfig.fields.indexOf(field) > -1) {
                field = this.getFieldName(field);
            }
            return field + ' ' + direction;
        }, this).join(', ');
    },

    buildFilters: function(what, value, _class) {
        var relatedClass = CRUD.EntityManager.hasRelation(_class, what);
        if (relatedClass) {
            for (var val in value) {
                this.buildFilters(val, value[val], what);
                this.buildJoins(_class, what);
            }
        } else if (!isNaN(parseInt(what, 10))) { // it's a custom sql where clause, just field=>value). unsafe because parameters are unbound, but very for custom queries.
            this.wheres.push(value);
        } else { // standard field=>value whereclause. Prefix with tablename for easy joins and push a value to the .
            if (what == 'ID') what = CRUD.EntityManager.getPrimary(_class);
            this.wheres.push(this.getFieldName(what, CRUD.EntityManager.entities[_class].table) + ' = ?');
            this.parameters.push(value);
        }
    },

    buildJoins: function(theClass, parent) { // determine what joins to use
        if (!parent) return; // nothing to join on, skip.
        var entity = CRUD.EntityManager.entities[theClass];
        parent = CRUD.EntityManager.entities[parent];

        switch (parent.relations[entity.getType()]) { // then check the relationtype
            case CRUD.RELATION_SINGLE:
            case CRUD.RELATION_FOREIGN:
                if (entity.fields.indexOf(parent.primary) > -1) {
                    this.addJoin(parent, entity, parent.primary);
                } else if (parent.fields.indexOf(entity.primary) > -1) {
                    this.addJoin(parent, entity, entity.primary);
                }
                break;
            case CRUD.RELATION_MANY: // it's a many:many relation. Join the connector table and then the related one.
                connectorClass = parent.connectors[entity.getType()];
                conn = CRUD.EntityManager.entities[connectorClass];
                this.addJoin(conn, entity, entity.primary).addJoin(parent, conn, parent.primary);
                break;
            case CRUD.RELATION_CUSTOM:
                var rel = parent.relations[entity.getType()];
                this.joins = this.joins.unshift(['LEFT JOIN', entity.table, 'ON', this.getFieldName(rel.sourceProperty, parent.table), '=', this.getFieldName(rel.targetProperty, entity.table)].join(' '));
                break;
            default:
                throw new Exception("Warning! class " + parent.getType() + " probably has no relation defined for class " + entity.getType() + "  or you did something terribly wrong..." + JSON.encode(parent.relations[_class]));
        }
    },

    addJoin: function(what, on, fromPrimary, toPrimary) {
        var join = ['LEFT JOIN', what.table, 'ON', this.getFieldName(fromPrimary, on.table), '=', this.getFieldName(toPrimary || fromPrimary, what.table)].join(' ');
        if (this.joins.indexOf(join) == -1) {
            this.joins.push(join);
        }
        return this;
    },

    buildQuery: function() {

        var where = this.wheres.length > 0 ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
        var order = (this.orders.length > 0) ? ' ORDER BY ' + this.orders.join(", ") : '';
        var group = (this.groups.length > 0) ? ' GROUP BY ' + this.groups.join(", ") : '';
        var query = 'SELECT ' + this.fields.join(", \n\t") + "\n FROM \n\t" + CRUD.EntityManager.entities[this.entity].table + "\n " + this.joins.join("\n ") + where + ' ' + group + ' ' + order + ' ' + this.limit;
        return ({
            query: query,
            parameters: this.parameters
        });
    },

    getCount: function() {
        var where = (this.wheres.length > 0) ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
        var group = (this.groups.length > 0) ? ' GROUP BY ' + this.groups.join(", ") : '';
        var query = "SELECT count(*) FROM \n\t" + CRUD.EntityManager.entities[this.entity].table + "\n " + this.joins.join("\n ") + where + ' ' + group;
        return (query);
    }
};