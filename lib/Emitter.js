const { EventEmitter } = require('events');

class Emitter {
    constructor() {
        this.events = {};
    }

    getEmitter(name) {
        if (!this.events[name]) {
            this.events[name] = new EventEmitter(name);
        }

        return this.events[name];
    }
}

module.exports = new Emitter();