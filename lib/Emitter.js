const { EventEmitter } = require('events');
var instance = null;

class Emitter {
    constructor() {
        if (!instance) {
            instance = this;
            this.events = {};
        }

        return instance;
    }

    getEmitter(name) {
        return this.events[name];
    }

    addEmitter(name) {
        this.events[name] = new EventEmitter(name);
        return this.events[name];
    }

    publish(name, data) {
        this.events[name] = data;
    }
}

module.exports = Emitter;