const AuditLogsModel = require('../db/models/AuditLogs');
const Enum = require('../config/Enum');

let instance = null;
class AuditLogs {
    //! Singleton
    constructor() {
        if(!instance) {
            instance = this;
        }

        return instance;
    }

    info(email, location, procType, log) {
        this.#saveToDB({
            level: "INFO",
            email, location, procType, log
        })
    }

    warn(email, location, procType, log) {
        this.#saveToDB({
            level: "WARN",
            email, location, procType, log
        })
    }

    error(email, location, procType, log) {
        this.#saveToDB({
            level: "ERROR",
            email, location, procType, log
        })
    }

    debug(email, location, procType, log) {
        this.#saveToDB({
            level: "DEBUG",
            email, location, procType, log
        })
    }

    verbose(email, location, procType, log) {
        this.#saveToDB({
            level: "VERBOSE",
            email, location, procType, log
        })
    }

    http(email, location, procType, log) {
        this.#saveToDB({
            level: "HTTP",
            email, location, procType, log
        })
    }
    
    //? "#" symbol ensures that the function can only be used within the class in which it is written.
    #saveToDB({ level, email, location, procType, log }) { 
        AuditLogsModel.create({
            level,  email, location, procType, log
        });
        console.log("**Audit log record has been created.")
    }
    
}

module.exports = new AuditLogs();