import Entity from './CRUD.Entity.js';
import CRUD from './CRUD.js';



class EntityManager {

        /**
     * Constructs an instance of EntityManager for managing entity classes.
     */
    constructor() {
        this.entities = {};
        this.definitions = {};
        this.defaultSetup = {
            className: 'CRUD.Entity',
            ID: false,
            table: false,
            primary: false,
            fields: [],
            indexes: [],
            autoSerialize: [],
            defaultValues: {},
            adapter: false,
            orderProperty: false,
            orderDirection: false,
            relations: {},
            connectors: {},
            createStatement: false,
            keys: []
        };
        this.constructors = {};
        this.cache = {};
        this.connectionAdapter = false;
    }

    getAdapter() {
        return this.connectionAdapter;
    }


    /**
     * Register a new entity into the entity manager, which will manage it's properties, relations, and data.
     */
    registerEntity(namedFunction, dbSetup, methods = {}) {
        //CRUD.log("Register entity", namedFunction, dbSetup, className);

        dbSetup.fields.map(function(field) {

            Object.defineProperty(namedFunction.prototype, field, {
                get: ((field in methods) && 'get' in methods[field]) ? methods[field].get : function() {
                    return this.get(field);
                },
                set: ((field in methods) && 'set' in methods[field]) ? methods[field].set : function(newValue) {

                    this.set(field, newValue);
                },
                enumerable: true,
                configurable: true
            });
        }, namedFunction);

        for (var j in methods) {
            if (dbSetup.fields.indexOf(j) == -1) {
                namedFunction.prototype[j] = methods[j];
            }
        }

        // define a __className__ constant on the thing
        let  className = namedFunction.prototype.constructor.name;
        Object.defineProperty(namedFunction.prototype, '__className__', {
            get: function() {
                return className;
            },
            enumerable: false,
            configurable: true
        });

        if (!(className in this.entities)) {
            this.entities[className] = EntityManager.clone(this.defaultSetup);
        }

        for (let prop in dbSetup) {
            this.entities[className][prop] = dbSetup[prop];
        }


        this.constructors[className] = function(ID) {
            let instance = new namedFunction();
            if (ID) {
                instance.primaryKeyInit(ID);
            }
            return instance;
        };

        dbSetup.fields.map(function(field) {
            namedFunction['findOneBy' + EntityManager.ucFirst(field)] = function(value, options) {
                var filter = {};
                filter[field] = value;
                return CRUD.FindOne(className, filter, options || {});
            };
            namedFunction['findBy' + EntityManager.ucFirst(field)] = function(value, options) {
                var filter = {};
                filter[field] = value;
                return CRUD.Find(className, filter, options || {});
            };
        });

        Object.keys(dbSetup.relations || {}).map(function(name) {
            namedFunction['findBy' + name] = function(filter, options) {
                var filters = {};
                filters[name] = filter;
                return CRUD.Find(className, filters, options || {});
            };
            namedFunction['findOneBy' + name] = function(filter, options) {
                var filters = {};
                filters[name] = filter;
                return CRUD.FindOne(className, filters, options || {});
            };
        });

        return namedFunction;
    };


    /**
     * Retrieves a registered entity class by its name, enabling dynamic access
     * to different entity types.
     *
     * @param {string} name - The name of the entity to retrieve.
     * @returns {object} The registered entity class.
     */
    getEntity(name) {
        return this.definitions[name];
    }

    getPrimary(className) {
        if (!className || !this.entities[className]) {
            throw "Invalid className passed to CRUD.EntityManager.getPrimary : " + className;
        }
        return this.entities[className].primary;
    }

    getDefaultValues(className) {
        if (!className || !this.entities[className]) {
            throw "Invalid className passed to CRUD.EntityManager.getDefaultValues : " + className;
        }
        return this.entities[className].defaultValues;
    }

    getFields(className) {
        return this.entities[className].fields;
    };
    hasRelation(className, related) {
        return ((related in this.entities[className].relations));
    };

    /**
     * Set and initialize the connection adapter.
     */
    async setAdapter(adapter) {
        this.connectionAdapter = adapter;
        await this.connectionAdapter.Init();
        return this;
    };

    static clone(el) {
        return JSON.parse(JSON.stringify(el));
    }

    static ucFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

}

export default EntityManager;