import CRUD from './CRUD.js';
import Entity from './CRUD.Entity.js';

/**
 * Enhanced SQLBuilder class to construct SQL queries with improved error handling, configuration, and modern JavaScript features.
 */
class SQLBuilder {
    /**
     * Initializes a new instance of SQLBuilder with entity, filters, and options.
     * @param {CRUD.Entity|string} entity - The entity type or instance for which the query is to be built.
     * @param {Object} filters - Conditions to apply to the query.
     * @param {Object} options - Additional options like orderBy, groupBy, limit, and specific fields.
     */
    constructor(entity, filters = {}, options = {}) {
        this.entity = entity instanceof Entity ? entity.getType() : entity;
        this.entityConfig = CRUD.EntityManager.entities[this.entity] || {};
        this.filters = filters;
        this.options = options;
        this.justthese = [];
        this.wheres = [];
        this.joins = [];
        this.fields = [];
        this.orders = [];
        this.groups = [];
        this.parameters = []; // parameters to bind to SQL query

        this.defaultLimit = 'LIMIT 0,2000'; // Default pagination limit
        this.initialize();
    }

    /**
     * Initializes filters, orders, groups, fields, and limit configuration.
     */
    initialize() {
        try {
            Object.keys(this.filters).forEach(key => this.buildFilters(key, this.filters[key], this.entity));

            this.orders = this.options.orderBy ?
                [this.prefixFieldNames(this.options.orderBy.replace('ORDER BY', ''))] :
                this.getDefaultOrder();

            this.groups = this.options.groupBy ? [this.options.groupBy.replace('GROUP BY', '')] : [];
            this.limit = this.options.limit ? `LIMIT ${this.options.limit}` : this.defaultLimit;

            (this.options.justthese || CRUD.EntityManager.entities[this.entity].fields).forEach(field => {
                this.fields.push(this.getFieldName(field));
            });
        } catch (error) {
            console.error("Failed to initialize SQLBuilder:", error);
            throw new Error(`Initialization failed: ${error.message}`);
        }
    }

    /**
     * Gets default order configuration if not provided in options.
     * @returns {string[]} Default order configuration.
     */
    getDefaultOrder() {
        if (this.entityConfig.orderProperty && this.entityConfig.orderDirection) {
            return [`${this.getFieldName(this.entityConfig.orderProperty)} ${this.entityConfig.orderDirection}`];
        }
        return [];
    }


    /**
     * Resolves the full field name by prefixing it with the table name, optimizing with memoization.
     * @param {string} field The field name to resolve.
     * @param {string} [table] Optional table name, defaults to the entity's table.
     * @returns {string} The fully qualified field name.
     */
    getFieldName(field, table = this.entityConfig.table) {
        this.fieldNameCache = this.fieldNameCache || {};
        const cacheKey = `${table}.${field}`;
        if (!this.fieldNameCache[cacheKey]) {
            this.fieldNameCache[cacheKey] = `${table}.${field}`;
        }
        return this.fieldNameCache[cacheKey];
    }

    /**
     * Adds table prefix to field names within a text containing comma-separated field names,
     * typically used in ORDER BY clauses. This method uses map for better performance and readability.
     * @param {string} text The text containing field names to be prefixed.
     * @returns {string} The modified text with prefixed field names.
     */
    prefixFieldNames(text) {
        const fields = text.split(',');
        return fields.map(field => {
            const [fieldName, direction = 'ASC'] = field.trim().split(' ');
            const upperDirection = direction.toUpperCase();
            const validDirection = ['ASC', 'DESC'].includes(upperDirection) ? upperDirection : 'ASC';
            return `${this.getFieldName(fieldName)} ${validDirection}`;
        }).join(', ');
    }

    /**
     * Builds filters for the SQL query based on provided key-value pairs.
     * Handles nested filters and relationships with improved error handling.
     * @param {string} key The filter key or field.
     * @param {any} value The value for the filter.
     * @param {string} _class The entity class for the filter.
     */
    buildFilters(key, value, _class) {
        try {
            const relatedClass = CRUD.EntityManager.hasRelation(_class, key);
            if (relatedClass) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                    this.buildFilters(subKey, subValue, key);
                    this.buildJoins(_class, key);
                });
            } else if (!isNaN(parseInt(key, 10))) { // Custom SQL where clause, unbound parameters
                this.wheres.push(value);
            } else { // Standard field-value where clause
                if (key === 'ID') key = CRUD.EntityManager.getPrimary(_class);
                this.wheres.push(`${this.getFieldName(key, CRUD.EntityManager.entities[_class].table)} = ?`);
                this.parameters.push(value);
            }
        } catch (error) {
            console.error("Error building filters:", error);
            throw new Error(`Error in buildFilters: ${error.message}`);
        }
    }

    /**
     * Adds a JOIN statement to the list of joins.
     * Implements error handling and optimization for join operations.
     * @param {Object} what The parent entity configuration.
     * @param {Object} on The entity configuration to join on.
     * @param {string} fromPrimary The primary field of the from entity.
     * @param {string} [toPrimary] The primary field of the to entity, defaults to fromPrimary.
     */
    addJoin(what, on, fromPrimary, toPrimary = fromPrimary) {
        try {
            const join = `LEFT JOIN ${what.table} ON ${this.getFieldName(fromPrimary, on.table)} = ${this.getFieldName(toPrimary, what.table)}`;
            if (!this.joins.includes(join)) {
                this.joins.push(join);
            }
        } catch (error) {
            console.error("Error adding join:", error);
            throw new Error(`Error in addJoin: ${error.message}`);
        }
        return this; // Enable chaining
    }

    /**
     * Builds the necessary JOIN statements based on entity relationships.
     * Handles different types of relations with robust error checking.
     * @param {string} theClass The current entity class.
     * @param {string} parent The parent entity class to join with.
     */
    buildJoins(theClass, parent) {
        if (!parent) return; // No parent to join on, skip
        try {
            const entity = CRUD.EntityManager.entities[theClass];
            const parentEntity = CRUD.EntityManager.entities[parent];
            const relationType = parentEntity.relations[entity.className];

            switch (relationType) {
                case CRUD.RELATION_SINGLE:
                case CRUD.RELATION_FOREIGN:
                    this.processSingleForeignRelations(entity, parentEntity);
                    break;
                case CRUD.RELATION_MANY:
                    this.processManyRelations(entity, parentEntity);
                    break;
                case CRUD.RELATION_CUSTOM:
                    this.processCustomRelations(entity, parentEntity);
                    break;
                default:
                    throw new Error(`Undefined relation type: ${relationType}`);
            }
        } catch (error) {
            console.error("Error building joins:", error);
            throw new Error(`Error in buildJoins: ${error.message}`);
        }
    }

    /**
     * Constructs the full SQL query with SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, and LIMIT clauses.
     * Includes error handling and optimization for query construction.
     * @returns {Object} The query and its parameters.
     */
    buildQuery() {
        try {
            const where = this.wheres.length > 0 ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
            const order = this.orders.length > 0 ? ' ORDER BY ' + this.orders.join(", ") : '';
            const group = this.groups.length > 0 ? ' GROUP BY ' + this.groups.join(", ") : '';
            const join = this.joins.join("\n ");
            const query = `SELECT ${this.fields.join(", \n\t")}\n FROM \n\t${this.entityConfig.table}\n ${join}${where}${group}${order} ${this.limit}`;
            return {
                query,
                parameters: this.parameters
            };
        } catch (error) {
            console.error("Error constructing query:", error);
            throw new Error(`Error in buildQuery: ${error.message}`);
        }
    }

    /**
     * Constructs a SQL query to count the number of records.
     * Incorporates error handling and optimization.
     * @returns {string} The count query.
     */
    getCount() {
        try {
            const where = this.wheres.length > 0 ? ' WHERE ' + this.wheres.join(" \n AND \n\t") : '';
            const group = this.groups.length > 0 ? ' GROUP BY ' + this.groups.join(", ") : '';
            const join = this.joins.join("\n ");
            return `SELECT count(*)\n FROM \n\t${this.entityConfig.table}\n ${join}${where}${group}`;
        } catch (error) {
            console.error("Error constructing count query:", error);
            throw new Error(`Error in getCount: ${error.message}`);
        }
    }

}

export default SQLBuilder