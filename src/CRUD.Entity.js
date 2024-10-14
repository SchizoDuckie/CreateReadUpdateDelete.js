import CRUD from './CRUD.js';

/**
 * Entity class handles the data operations for CRUD operations, maintaining both the current and dirty states of entity properties.
 */
class Entity {
  __values__ = {};
  __dirtyValues__ = {};
  constructor() {

  }

  /**
   * Returns the primary key ID of the entity.
   * @returns {any} The primary key or false if not present.
   */
  getID() {
    return this.get(CRUD.EntityManager.getPrimary(this.getType())) || false;
  }

  /**
   * Returns the entity data as a plain object.
   * @returns {Object} The values of the entity.
   */
  asObject() {
    return this.__values__;
  }

  /**
   * Retrieves the complete, current state of the entity's values, including modifications.
   * @returns {Object} The complete set of values.
   */
  getValues() {
    const values = { ...this.__values__ };
    if (Object.keys(this.__dirtyValues__).length > 0) {
      Object.assign(values, this.__dirtyValues__);
    }
    values.ID = this.getID();
    return values;
  }


  /**
   * Returns the type (class name) of the entity.
   * @returns {string} The class name of the entity.
   */
  getType() {
    return this.__className__;
  }


  /**
   * Imports and optionally marks entire sets of values as dirty.
   * @param {Object} values - Values to import.
   * @param {boolean} dirty - Whether to mark these values as dirty.
   */
  importValues(values, dirty = false) {
    for (let field in values) {
      if (CRUD.EntityManager.entities[this.getType()].autoSerialize.includes(field)) {
        this.__values__[field] = typeof values[field] === 'string' ? JSON.parse(values[field]) : values[field];
      } else {
        this.__values__[field] = values[field];
      }
    }
    if (dirty) {
      this.__dirtyValues__ = { ...this.__values__ };
      this.__values__ = {};
    }
    return this;
  }

  /**
   * Gets a value for a specific field, with an optional default.
   * @param {string} field - The field to retrieve.
   * @param {any} def - Default value if field is not present.
   * @returns {any} The value of the field or default.
   */
  get(field, def = undefined) {
    if (field in this.__dirtyValues__) {
      return this.__dirtyValues__[field];
    } else if (field in this.__values__) {
      return this.__values__[field];
    } else if(!field in CRUD.EntityManager.entities[this.getType()].fields) {
      CRUD.log(`Could not find field '${field}' in '${this.__className__}' (for get)`);
      return def;
    }
  }

  /**
   * Sets a value for a specific field. Marks the field as dirty if the value changes.
   * @param {string} field - The field to set.
   * @param {any} value - The new value for the field.
   */
  set (field, value) {
    if ((field in this)) {
      if (this.get(field) !== value && !([null, undefined].indexOf(this.get(field)) > -1 && [null, undefined].indexOf(value) > -1)) {
        if (CRUD.EntityManager.entities[this.getType()].autoSerialize.indexOf(field) > -1) {
          if (JSON.stringify(this.get(field)) != JSON.stringify(value)) {
            this.__dirtyValues__[field] = value;
          }
        } else {
          this.__dirtyValues__[field] = value;
        }
      }
    } else {
      CRUD.log("Could not find field '" + field + "' in '" + this.getType() + "' (for set)");
    }
  }


  /**
   * Proxy find function to find related entities from the instance itself.
   * @param {Function} type - The entity class to find.
   * @param {Object} filters - Filters to apply to the find operation.
   * @param {Object} options - Additional options for the find operation.
   * @returns {Promise} A promise that resolves with the found entities.
   */
  async Find(type, filters = {}, options = {}) {
    filters = { ...filters, [this.__classname__]: { [CRUD.EntityManager.getPrimary(__classname__)]: this.getID() } };
    return CRUD.Find(type, filters, options);
  }

  /**
   * Connects this entity with another entity based on their relationship type.
   * @param {Entity} to - The entity to connect with.
   */
  Connect(to) {
    const targetType = to.getType();
    const thisType = this.getType();
    const thisPrimary = CRUD.EntityManager.getPrimary(this);
    const targetPrimary = CRUD.EntityManager.getPrimary(to);

    return new Promise((resolve, reject) => {
      Promise.all([this.Save(), to.Save()]).then(() => {
        const relationType = this.dbSetup.relations[targetType];
        switch (relationType) {
          case CRUD.RELATION_SINGLE:
          case CRUD.RELATION_FOREIGN:
            to.set(thisPrimary, this.getID());
            this.set(targetPrimary, to.getID());
            break;
          case CRUD.RELATION_MANY:
            const connector = new window[this.dbSetup.connectors[targetType]]();
            connector.set(thisPrimary, this.getID());
            connector.set(targetPrimary, to.getID());
            connector.Save().then(resolve, reject);
            return;
          case CRUD.RELATION_CUSTOM:
            // Custom relation handling can be implemented as needed.
            console.log("Custom relation handling not implemented.");
            reject(new Error("Custom relation handling not implemented."));
            break;
        }
        Promise.all([to.Save(), this.Save()]).then(resolve, reject);
      }, reject);
    });
  }

  /**
   * Disconnects this entity from another entity based on their relationship type.
   * @param {Entity} from - The entity to disconnect from.
   */
  Disconnect(from) {
    const targetType = from.getType();
    const thisType = this.getType();
    const thisPrimary = CRUD.EntityManager.getPrimary(this);
    const targetPrimary = CRUD.EntityManager.getPrimary(from);

    return new Promise((resolve, reject) => {
      Promise.all([this.Save(), from.Save()]).then(() => {
        const relationType = this.dbSetup.relations[targetType];
        switch (relationType) {
          case CRUD.RELATION_SINGLE:
          case CRUD.RELATION_FOREIGN:
            from.set(thisPrimary, null);
            this.set(targetPrimary, null);
            break;
          case CRUD.RELATION_MANY:
            CRUD.FindOne(this.dbSetup.connectors[targetType], { [thisPrimary]: this.getID(), [targetPrimary]: from.getID() })
                .then(connectorInstance => {
                  connectorInstance.Delete().then(resolve, reject);
                }, reject);
            return;
          case CRUD.RELATION_CUSTOM:
            // Custom disconnection logic can be implemented as needed.
            console.log("Custom disconnection handling not implemented.");
            reject(new Error("Custom disconnection handling not implemented."));
            break;
        }
        Promise.all([from.Save(), this.Save()]).then(resolve, reject);
      }, reject);
    });
  }

  /**
   * Persists the entity's changes to the database.
   * @param {boolean} forceInsert - Whether to force insertion instead of updating.
   * @returns {Promise} A promise that resolves when the operation is complete.
   */
  async Save(forceInsert = false) {

    const that = this;
    const thatType = this.getType();

    if (!forceInsert && Object.keys(this.__dirtyValues__).length === 0) return;

    if (this.getID() === false || forceInsert) {
      const defaults = CRUD.EntityManager.entities[thatType].defaultValues;
      for (let field in defaults) {
        if (!(field in this.__dirtyValues__)) {
          this.__dirtyValues__[field] = defaults[field];
        }
      }
    }

    try {
      let adapter = CRUD.EntityManager.getAdapter();

      let result = await CRUD.EntityManager.getAdapter().Save(this, forceInsert);

      const insertResult = await CRUD.EntityManager.getAdapter().db.query('SELECT last_insert_rowid() as id').get();
      //console.log("last inserted id: ", insertResult);

        this.__dirtyValues__[CRUD.EntityManager.getPrimary(thatType)] = insertResult.id;
       // CRUD.EntityManager.cache[thatType][insertResult.id] = this;

      Object.assign(this.__values__, this.__dirtyValues__);
      this.__dirtyValues__ = {};
      this.ID = this.__values__[CRUD.EntityManager.getPrimary(thatType)];
      return result;
    } catch (error) {
      CRUD.log("Error saving CRUD entity", that, error);
      throw(error);
    }
  }

  /**
   * Deletes the entity using the CRUD adapter.
   * @returns {Promise} A promise that resolves with the deletion result.
   */
  async Delete() {
    try {
      await CRUD.EntityManager.getAdapter().Delete(this);

      CRUD.log(`${this.getType()} ${this.getID()} has been deleted!`);
      delete CRUD.EntityManager.cache[this.getType()][this.getID()];
      this.__values__[CRUD.EntityManager.getPrimary(this.getType())] = false;
    } catch (error) {
      CRUD.log("Error deleting entity", this, error);
      throw error
    }
  }


  /**
   * Used to initialize the entity with a primary key ID, often used after creation.
   * @param {any} ID - The primary key value for the entity.
   */
  primaryKeyInit(ID) {
    this.ID = ID || false;
    if (this.ID !== false) {
      return this.Find({
        "ID": ID
      });
    }
  }

  /**
   * Serializes the entity to JSON, typically for logging or sending to a client.
   * @returns {Object} The JSON representation of the entity.
   */
  toJSON() {
    return this.asObject();
  }

  static findByID(id) {
    let filters = {};
    filters[dbSetup.primary] = id;
    return CRUD.FindOne(this.prototype.constructor.name, filters);
  }

  static Find(filters, options) {
    return CRUD.Find(this.prototype.constructor.name, filters, options);
  }

  static FindOne(filters, options) {
    return CRUD.FindOne(this.prototype.constructor.name, filters, options);
  }

}

export default Entity;
