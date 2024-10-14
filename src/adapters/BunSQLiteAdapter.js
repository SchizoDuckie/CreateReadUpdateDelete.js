import { Database } from "bun:sqlite";
import SQLBuilder from '../CRUD.SQLBuilder.js';
import CRUD from '../CRUD.bun';
import ConnectionAdapter from "./ConnectionAdapter.js";

/**
 * Adapter for SQLite database using Bun's SQLite bindings.
 */
class BunSQLiteAdapter extends ConnectionAdapter {
    static name = 'BunSQLiteAdapter';

    /**
     * Construct a new BunSQLiteAdapter instance.
     * @param {string} databaseName - The name of the database to be used.
     */
    constructor(databaseName) {
        super();
        this.databaseName = databaseName;
        this.db = null;  // Will hold the active database connection
    }

    /**
     * Delay execution until the database setup is done.
     * @param {number} checkInterval - Interval to check the setup status (in milliseconds).
     */
    async delayUntilSetupDone(checkInterval = 1000) {
        while (this.initializing) {
            await Bun.sleep(checkInterval);
        }
    }

    /**
     * Connect to the SQLite database.
     * @param {string} databaseName - The name of the database to connect to.
     */
    connect(databaseName) {
        if (!this.db) {
            this.db = new Database(databaseName, { create: true, readwrite: true });
            this.db.exec("PRAGMA journal_mode = WAL;");
            console.log(`Connected to database ${databaseName}!`);
        }
        return true;
    }

    /**
     * Initialize the database, verifying tables and setting up listeners.
     */
    async Init() {
        this.connect(this.databaseName);
        await this.verifyTables();
        this.initializing = false;

        const cleanup = () => {
            console.log("Closing database connection.");
            if (this.db) {
                this.db.close();
            }
            console.log("Database connection closed.");
            process.exit(0);
        };

        process.on("SIGINT", cleanup);
        process.on("exit", cleanup);
    }

    /**
     * Initialize a table in the SQLite database.
     * @param {string} tableName - The name of the table to initialize.
     * @param {string} createStatement - The SQL statement to create the table.
     */
    async initTable(tableName, createStatement) {
        this.db.exec(createStatement);
        console.log(`Table ${tableName} created.`);
    }

    /**
     * Execute a query on the SQLite database.
     * @param {string} query - The SQL query to execute.
     * @param {Array} params - The query parameters.
     * @returns {Array} - The results of the query.
     * @throws {Error} - Throws an error if the query execution fails.
     */
    async query(query, params = []) {
        let statement;
        try {
            statement = this.db.prepare(query);
            const results = statement.all(params);
            // console.log(`Executed query: ${query} with params: ${JSON.stringify(params)}`);
            return results;
        } catch (error) {
            console.error(`Failed to execute query: ${query} with params: ${JSON.stringify(params)}`, error);
            throw new Error(`SQL Error: ${error.message}`);
        } finally {
            if (statement) statement.finalize();  // Ensure statement is finalized
        }
    }

    /**
     * Insert a record into the SQLite database.
     * @param {string} tableName - The name of the table to insert the record into.
     * @param {Object} data - The data to insert.
     * @returns {number} - The ID of the inserted record.
     */
    insert(tableName, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES(${placeholders})`;
        const statement = this.db.prepare(query);
        const result = statement.run(values);
        return result.lastInsertRowid;
    }

    /**
     * Update a record in the SQLite database.
     * @param {string} tableName - The name of the table containing the record to update.
     * @param {Object} data - The data to update.
     * @param {string} condition - The condition for the update query.
     * @param {Array} params - The query parameters.
     */
    update(tableName, data, condition, params) {
        const setFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), ...params];
        const query = `UPDATE ${tableName} SET ${setFields} WHERE ${condition}`;
        const statement = this.db.prepare(query);
        statement.run(values);
    }

    /**
     * Delete a record from the SQLite database.
     * @param {string} tableName - The name of the table containing the record to delete.
     * @param {string} condition - The condition for the delete query.
     * @param {Array} params - The query parameters.
     */
    delete(tableName, condition, params) {
        const query = `DELETE FROM ${tableName} WHERE ${condition}`;
        const statement = this.db.prepare(query);
        statement.run(params);
    }

    /**
     * Verify and create tables based on the entity manager's configuration.
     */
    async verifyTables() {
        let tables = this.fetchExistingTablesAndIndexes();
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
     * @returns {Set<string>} A set of existing table names.
     */
    fetchExistingTablesAndIndexes() {
        let query = "SELECT type, name, tbl_name FROM sqlite_master WHERE type IN ('table', 'index', 'view')";
        const resultset = this.db.query(query).all();
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
                await this.db.exec(migrationScript);
                console.log(`Migration version ${version} applied for ${entity.className}.`);
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
                await this.db.exec(indexQuery);
                console.log(`Index on ${index} created for ${entity.table}.`);
            }
        }
    }

    /**
     * Find records in the database.
     * @param {string} what - The columns to select.
     * @param {Object} filters - The conditions for the query.
     * @param {Object} options - Additional options for the query like sorting and limit.
     * @returns {Array<Object>} The found records.
     */
    async Find(what, filters, options) {
        const builder = new SQLBuilder(what, filters, options);
        const queryData = builder.buildQuery();
        await this.delayUntilSetupDone();

        try {
            return this.query(queryData.query, queryData.parameters);
        } catch (error) {
            console.error('SQL Error in FIND:', error.message);
            throw error;
        }
    }

    /**
     * Save a record in the database.
     * @param {Object} what - The record to save.
     * @param {boolean} forceInsert - Force an insert operation.
     * @returns {boolean} True if the operation was successful.
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

        // Serialize fields that require auto serialization
        CRUD.EntityManager.entities[what.getType()].autoSerialize.forEach(field => {
            if (names.indexOf(field) > -1) {
                valmap[names.indexOf(field)] = JSON.stringify(valmap[names.indexOf(field)]);
            }
        });

        if (what.getID() === false || forceInsert) {
            // New object: insert
            const primaryKeyName = CRUD.EntityManager.getPrimary(what.getType());
            const insertQuery = `INSERT INTO ${CRUD.EntityManager.entities[what.getType()].table} (${names.join(", ")}) VALUES (${values.join(", ")}) RETURNING ${primaryKeyName} as id;`;
            const result = this.db.prepare(insertQuery).get(valmap);
            what.__values__[primaryKeyName] = result.id;
        } else {
            // Existing object: update
            const updateQuery = `UPDATE ${CRUD.EntityManager.entities[what.getType()].table} SET ${names.map(name => `${name} = ?`).join(", ")} WHERE ${CRUD.EntityManager.getPrimary(what.getType())} = ?`;
            valmap.push(what.getID());
            this.db.prepare(updateQuery).run(valmap);
        }

        what.__dirtyValues__ = {};
        return true;
    }

    /**
     * Delete a record from the database.
     * @param {Object} what - The record to delete.
     * @returns {boolean} True if the operation was successful.
     */
    async Delete(what) {
        if (what.getID() !== false) {
            const deleteQuery = `DELETE FROM ${CRUD.EntityManager.entities[what.getType()].table} WHERE ${CRUD.EntityManager.getPrimary(what.getType())} = ?`;
            this.db.prepare(deleteQuery).run([what.getID()]);
            return true;
        } else {
            return false;
        }
    }
}

export default BunSQLiteAdapter;
