const logger = require('./logger');
let instance = null;

class LoggerClass {
    constructor() {
        if (!instance) {
            instance = this;
        }

        return instance;
    }

    info({ email, location, procType, log }) {
        logger.info({
            email, location, procType, log
        });
    }

    warn({ email, location, procType, log }) {
        logger.warn({
            email, location, procType, log
        });
    }

    error({ email, location, procType, log }) {
        logger.error({
            email, location, procType, log
        });
    }

    http({ email, location, procType, log }) {
        logger.http({
            email, location, procType, log
        });
    }

    verbose({ email, location, procType, log }) {
        logger.verbose({
            email, location, procType, log
        });
    }
    silly({ email, location, procType, log }) {
        logger.silly({
            email, location, procType, log
        });
    }

}

module.exports = new LoggerClass();