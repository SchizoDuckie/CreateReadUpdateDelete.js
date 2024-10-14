import sqlite3 from 'sqlite3';
import SQLBuilder from '../CRUD.SQLBuilder.js';
import CRUD from '../CRUD.js';
import ConnectionAdapter from "./ConnectionAdapter.js";

/**
 * Adapter for SQLite database using Node.js sqlite3 module.
 */
class NodeSQLiteAdapter extends ConnectionAdapter {
    static name = 'NodeSQLiteAdapter';

    /**
     * Construct a new NodeSQLiteAdapter instance.
     * @param {string} databaseName - The name of the database to be used.
     */
    constructor(databaseName) {
        super();
        this.databaseName = databaseName;
        this.db = null;  // Will hold the active database connection
    }

    /**
     * Connect to the SQLite database.
     * @param {string} databaseName - The name of the database to connect to.
     * @returns {Promise<boolean>} A promise that resolves to true if the connection was successful.
     */
    connect(databaseName) {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(databaseName, (err) => {
                if (err) {
                    console.error(`Error connecting to database ${databaseName}:`, err);
                    reject(err);
                } else {
                    console.log(`Connected to database ${databaseName}!`);
                    resolve(true);
                }
            });
        });
    }

    /**
     * Initialize the database, verifying tables and setting up listeners.
     */
    async Init() {
        await this.connect(this.databaseName);
        await this.verifyTables();
        this.initializing = false;

        process.on("SIGINT", this.cleanup.bind(this));
        process.on("exit", this.cleanup.bind(this));
    }

    /**
     * Clean up database connection on process exit.
     */
    cleanup() {
        console.log("Closing database connection.");
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error("Error closing database:", err);
                } else {
                    console.log("Database connection closed.");
                }
                process.exit(0);
            });
        }
    }

    /**
     * Initialize a table in the SQLite database.
     * @param {string} tableName - The name of the table to initialize.
     * @param {string} createStatement - The SQL statement to create the table.
     * @returns {Promise<void>}
     */
    async initTable(tableName, createStatement) {
        return new Promise((resolve, reject) => {
            this.db.run(createStatement, (err) => {
                if (err) {
                    console.error(`Error creating table ${tableName}:`, err);
                    reject(err);
                } else {
                    console.log(`Table ${tableName} created.`);
                    resolve();
                }
            });
        });
    }

    /**
     * Execute a query on the SQLite database.
     * @param {string} query - The SQL query to execute.
     * @param {Array} params - The query parameters.
     * @returns {Promise<Array>} - The results of the query.
     * @throws {Error} - Throws an error if the query execution fails.
     */
    async query(query, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error(`Failed to execute query: ${query} with params: ${JSON.stringify(params)}`, err);
                    reject(new Error(`SQL Error: ${err.message}`));
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Insert a record into the SQLite database.
     * @param {string} tableName - The name of the table to insert the record into.
     * @param {Object} data - The data to insert.
     * @returns {Promise<number>} - The ID of the inserted record.
     */
    async insert(tableName, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES(${placeholders})`;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Update a record in the SQLite database.
     * @param {string} tableName - The name of the table containing the record to update.
     * @param {Object} data - The data to update.
     * @param {string} condition - The condition for the update query.
     * @param {Array} params - The query parameters.
     * @returns {Promise<void>}
     */
    async update(tableName, data, condition, params) {
        const setFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), ...params];
        const query = `UPDATE ${tableName} SET ${setFields} WHERE ${condition}`;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, values, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Delete a record from the SQLite database.
     * @param {string} tableName - The name of the table containing the record to delete.
     * @param {string} condition - The condition for the delete query.
     * @param {Array} params - The query parameters.
     * @returns {Promise<void>}
     */
    async delete(tableName, condition, params) {
        const query = `DELETE FROM ${tableName} WHERE ${condition}`;
        
        return new Promise((resolve, reject) => {
            this.db.run(query, params, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Verify and create tables based on the entity manager's configuration.
     */
    async verifyTables() {
        let tables = await this.fetchExistingTablesAndIndexes();
        let entityNames = Object.keys(CRUD.EntityManager.entities);

        for (const entityName of entityNames) {
            const entity = CRUD.EntityManager.entities[entityName];
            if (!tables.has(entity.table)) {
                await this.createTable(entityName);
            }
            await this.handleMigrations(entity, tables);
            await this.verifyAndCreateIndexes(entity, tables);
        }
    }

    /**
     * Fetch existing tables and indexes from the database.
     * @returns {Promise<Set<string>>} A promise that resolves to a set of existing table names.
     */
    async fetchExistingTablesAndIndexes() {
        const query = "SELECT type, name, tbl_name FROM sqlite_master WHERE type IN ('table', 'index', 'view')";
        const resultset = await this.query(query);
        const tables = new Set();
        resultset.forEach(row => {
            if (row.type === 'table' || row.type === 'view') {
                tables.add(row.tbl_name);
            }
        });
        return tables;
    }

    /**
     * Create a table based on its defined structure in the entity manager.
     * @param {string} entityName - The name of the entity.
     */
    async createTable(entityName) {
        let entity = CRUD.EntityManager.entities[entityName];
        if (!entity.createStatement) {
            throw new Error("No create statement found for " + entity.className);
        }
        await this.initTable(entity.table, entity.createStatement);

        if (entity.fixtures) {
            await this.insertFixtures(entity.table, entity.fixtures);
        }
    }

    /**
     * Insert fixtures into a table.
     * @param {string} tableName - The name of the table.
     * @param {Array<Object>} fixtures - The fixtures to insert.
     */
    async insertFixtures(tableName, fixtures) {
        for (const fixture of fixtures) {
            await this.insert(tableName, fixture);
        }
        console.log(`Fixtures inserted for ${tableName}.`);
    }

    /**
     * Handle migrations for an entity if it has any defined.
     * @param {Object} entity - The entity to handle migrations for.
     * @param {Set<string>} tables - A set of existing table names.
     */
    async handleMigrations(entity, tables) {
        if (!tables.has(entity.table)) return;
        if (entity.migrations) {
            for (const [version, migrationScript] of Object.entries(entity.migrations)) {
                await new Promise((resolve, reject) => {
                    this.db.exec(migrationScript, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`Migration version ${version} applied for ${entity.className}.`);
                            resolve();
                        }
                    });
                });
            }
        }
    }

    /**
     * Verify and create indexes for an entity.
     * @param {Object} entity - The entity to create indexes for.
     * @param {Set<string>} tables - A set of existing table names.
     */
    async verifyAndCreateIndexes(entity, tables) {
        if (!tables.has(entity.table)) return;
        if (entity.indexes) {
            for (const index of entity.indexes) {
                const indexName = `idx_${index}_${entity.table}`;
                const indexQuery = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${entity.table}(${index})`;
                await new Promise((resolve, reject) => {
                    this.db.run(indexQuery, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            console.log(`Index on ${index} created for ${entity.table}.`);
                            resolve();
                        }
                    });
                });
            }
        }
    }

    /**
     * Find records in the database.
     * @param {string} what - The columns to select.
     * @param {Object} filters - The conditions for the query.
     * @param {Object} options - Additional options for the query like sorting and limit.
     * @returns {Promise<Array<Object>>} The found records.
     */
    async Find(what, filters, options) {
        const builder = new SQLBuilder(what, filters, options);
        const queryData = builder.buildQuery();

        try {
            return await this.query(queryData.query, queryData.parameters);
        } catch (error) {
            console.error('SQL Error in FIND:', error.message);
            throw error;
        }
    }

    /**
     * Save a record in the database.
     * @param {Object} what - The record to save.
     * @param {boolean} forceInsert - Force an insert operation.
     * @returns {Promise<boolean>} True if the operation was successful.
     */
    async Save(what, forceInsert) {
        CRUD.stats.writesQueued++;
        const query = [];
        const values = [];
        const valmap = [];
        const names = [];

        Object.keys(what.__dirtyValues__).forEach(field => {
            names.push(field);
            values.push('?');
            valmap.push(what.__dirtyValues__[field]);
        });

        Object.keys(CRUD.EntityManager.entities[what.getType()].defaultValues).forEach(field => {
            if (!(field in what.__dirtyValues__) && !(field in what.__values__)) {
                names.push(field);
                values.push('?');
                valmap.push(CRUD.EntityManager.entities[what.getType()].defaultValues[field]);
            }
        });

        CRUD.EntityManager.entities[what.getType()].autoSerialize.forEach(field => {
            if (names.indexOf(field) > -1) {
                valmap[names.indexOf(field)] = JSON.stringify(valmap[names.indexOf(field)]);
            }
        });

        if (what.getID() === false || forceInsert) {
            const primaryKeyName = CRUD.EntityManager.getPrimary(what.getType());
            const insertQuery = `INSERT INTO ${CRUD.EntityManager.entities[what.getType()].table} (${names.join(", ")}) VALUES (${values.join(", ")})`;
            
            return new Promise((resolve, reject) => {
                this.db.run(insertQuery, valmap, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        what.__values__[primaryKeyName] = this.lastID;
                        resolve(true);
                    }
                });
            });
        } else {
            const updateQuery = `UPDATE ${CRUD.EntityManager.entities[what.getType()].table} SET ${names.map(name => `${name} = ?`).join(", ")} WHERE ${CRUD.EntityManager.getPrimary(what.getType())} = ?`;
            valmap.push(what.getID());
            
            return new Promise((resolve, reject) => {
                this.db.run(updateQuery, valmap, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        }
    }

    /**
     * Delete a record from the database.
     * @param {Object} what - The record to delete.
     * @returns {Promise<boolean>} True if the operation was successful.
     */
    async Delete(what) {
        if (what.getID() !== false) {
            const deleteQuery = `DELETE FROM ${CRUD.EntityManager.entities[what.getType()].table} WHERE ${CRUD.EntityManager.getPrimary(what.getType())} = ?`;
            
            return new Promise((resolve, reject) => {
                this.db.run(deleteQuery, [what.getID()], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            });
        } else {
            return false;
        }
    }
}

export default NodeSQLiteAdapter;