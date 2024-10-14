import CRUD from '../CRUD.js';

/**
 * Default interface for a connection.
 * Implement these methods for a new adapter.
 */
class ConnectionAdapter {
    constructor(endpoint, options) {
        this.endpoint = endpoint || false;
        this.options = options || {};
    }

    async Init() {
        CRUD.log("The Init method for you connection adapter is not implemented!");
        debugger;
    }

    async Delete(what) {
        CRUD.log("The Delete method for your connection adaptor is not implemented!");
        debugger;
    }

    async Save(what) {
        CRUD.log("The Persist method for your connection adaptor is not implemented!");
        debugger;
    }

    async Find (what, filters, sorting, justthese, options) {
        CRUD.log("The Find method for your connection adaptor is not!");
        debugger;
    }
}

export default ConnectionAdapter