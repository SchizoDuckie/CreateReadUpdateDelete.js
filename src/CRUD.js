import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Entity from './CRUD.Entity.js';
import EntityManager from './CRUD.EntityManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class CRUD {

    static RELATION_SINGLE = 1;
    static RELATION_FOREIGN = 2;
    static RELATION_MANY= 3;
    static RELATION_CUSTOM= 4;
    static DEBUG = false;
    static __log = {
        writesQueued: 0,
        writesExecuted: 0
    };
    static __statsListeners= [];
    static instance;

    addStatsListener (listener) {
        CRUD.__statsListeners.push(listener);
    }

    log() {
        //if (CRUD.DEBUG) {
        console.log.apply(console, arguments);
        //}
    }


  /**
   * Initializes a new instance of the CRUD class, setting up the necessary
   * properties for managing database operations.
   */
  constructor() {

    this.initialized = false;
    this.adapters = {};
    this.definitions = {};
    this.EntityManager = new EntityManager();
    this.stats = {
      writesQueued: 0,
      writesExecuted: 0
    }
  }

  

  /**
   * Initializes the CRUD system with the specified configuration. It sets up
   * the database adapter and initializes tables for all registered entities.
   *
   * @param {object} config - Configuration for CRUD operations.
   * @param {string} config.adapter - The adapter name for database operations.
   */
  async init(config) {
    if (!this.initialized) {
      await this._registerEntities();
      await this._registerAdapters();
      console.log("Registered adapters: ", this.adapters, "requested: ", config.adapter);
      this.EntityManager.setAdapter(new this.adapters[config.adapter](config.databaseName));
      this.initialized = true;
    }
    return this;
  }

  /**
   * Registers entities from the 'entities' directory for CRUD operations.
   * It reads JavaScript files from the specified directory, assuming CRUD.RegisterEntity
   * has already been called when the file is included.
   */
  async _registerEntities() {
    const entitiesDir = path.join(__dirname, 'entities');
    const entityFiles = fs.readdirSync(entitiesDir);

    for (const file of entityFiles) {
      if (file.endsWith('.js')) {
        const modulePath = `file://${path.join(entitiesDir, file)}`;
        try {
          // Simply importing the file should trigger the entity registration
          await import(modulePath);
          console.log(`Processed entity file: ${file}`);
        } catch (error) {
          console.error(`Error processing entity file ${file}:`, error);
        }
      }
    }

    // Log the registered entities
    console.log("Registered entities:", Object.keys(this.EntityManager.entities));
  }


  /**
   * Registers database adapters from the 'adapters' directory.
   * It reads JavaScript files from the specified directory and adds each as an available adapter for database operations.
   */
  async _registerAdapters() {
    const adaptersDir = path.join(__dirname, 'adapters');
    const adapterFiles = fs.readdirSync(adaptersDir);

    for (const file of adapterFiles) {
      if (file.endsWith('.js')) {
        const modulePath = `file://${path.join(adaptersDir, file)}`;
        try {
          const AdapterModule = await import(modulePath);
          const AdapterClass = AdapterModule.default;
          if (AdapterClass && AdapterClass.name) {
            this.adapters[AdapterClass.name] = AdapterClass;
            console.log(`Registered adapter: ${AdapterClass.name}`);
          } else {
            console.error(`Invalid adapter structure in ${file}. Expected a class with a static 'name' property.`);
          }
        } catch (error) {
          console.error(`Error loading adapter from ${file}:`, error);
        }
      }
    }
  }
  /**
   * Establishes a connection to the database.
   *
   * @param {string} databaseName - The name of the database to connect to.
   */
  connect(databaseName) {
    this.adapter.connect(databaseName);
  }

  /**
   * Initializes a table in the database with the specified structure.
   *
   * @param {string} tableName - The name of the table to initialize.
   * @param {Object} fields - The fields of the table in a key-value pair format.
   */
  initTable(tableName, fields) {
    this.adapter.initTable(tableName, fields);
  }

  /**
   * Executes a query on the database.
   *
   * @param {string} query - The SQL query to execute.
   * @param {Array} params - The parameters for the query.
   * @returns {Array} The results of the query.
   */
  query(query, params) {
    return this.adapter.query(query, params);
  }

  /**
   * Inserts a record into the specified table in the database.
   *
   * @param {string} tableName - The name of the table to insert the record into.
   * @param {Object} data - The data to insert into the table.
   * @returns {number} The ID of the inserted record.
   */
  insert(tableName, data) {
    return this.adapter.insert(tableName, data);
  }

  /**
   * Updates a record in the specified table in the database.
   *
   * @param {string} tableName - The name of the table containing the record.
   * @param {Object} data - The data to update in the record.
   * @param {string} condition - The condition for identifying records to update.
   * @param {Array} params - Additional parameters for the update query.
   */
  update(tableName, data, condition, params) {
    this.adapter.update(tableName, data, condition, params);
  }

  /**
   * Deletes a record from the specified table in the database.
   *
   * @param {string} tableName - The name of the table to delete the record from.
   * @param {string} condition - The condition for identifying records to delete.
   * @param {Array} params - Additional parameters for the delete query.
   */
  delete(tableName, condition, params) {
    this.adapter.delete(tableName, condition, params);
  }


  define(namedFunction, properties, methods) {
    return this.EntityManager.registerEntity(namedFunction, properties, methods);
  };

  setAdapter(adapter) {
    return this.EntityManager.setAdapter(adapter);
  };

  /**
   * CRUD.Find is probably the function that you'll use most to query things:
   *
   * Syntax:
   * CRUD.Find(Product, { Catalog: { ID: 1 }} ).then( function(products) {
   *		for(var i=0; i< products.length; i++) {
   *			$$(".body")[0].adopt(products[i].display());
   *		}
   *	}, function(error) { CRUD.log("ERROR IN CRUD.FIND for catalog 1 ", error); });
   */
  async Find(obj, filters, options) {
    var type = null;

    if (obj instanceof Entity || obj.prototype instanceof Entity) {
      type = obj.prototype.getType();

      if (obj instanceof Entity && obj.getID() !== false) {
        CRUD.log("Object has an ID! ", ID, type);
        filters.ID = obj.getID();
        filters.type = filters;
      }
    } else if ((obj in this.EntityManager.entities)) {
      type = obj;
    } else {
      throw "CRUD.Find cannot search for non-CRUD objects like " + obj + "!";
    }


    let results = await this.EntityManager.connectionAdapter.Find(type, filters, options);

    return results.map(function(el) {

      if (!(type in this.EntityManager.cache)) {
        this.EntityManager.cache[type] = {};
      }
      var idProp = this.EntityManager.entities[type].primary;
      if (!(el[idProp] in this.EntityManager.cache[type])) {
        this.EntityManager.cache[type][el[idProp]] = new this.EntityManager.constructors[type]();
      }
      return this.EntityManager.cache[type][el[idProp]].importValues(el);
    }, this);

  };


  /**
   * Uses CRUD.find with a limit 0,1 and returns the first result.
   * @returns Promise
   */
   FindOne(obj, filters, options) {
    options = options || {};
    options.limit = 1;
    return this.Find(obj, filters, options).then(function(result) {
      return result[0];
    });
  };


  fromCache(obj, values) {
    try {
      obj = (typeof obj == 'function') ? new obj() : new this.EntityManager.constructors[obj]();
      type = (obj instanceof Entity) ? obj.__className__ : false;
    } catch (E) {
      CRUD.log("CRUD.fromCache cannot create for non-CRUD objects like " + obj + "! \n" + E);
      return false;
    }
    obj.importValues(values, true);
    return obj;
  };

}

const CRUDInstance = new CRUD();

export default CRUDInstance;