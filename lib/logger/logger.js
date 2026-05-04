const { format, createLogger, transports } = require('winston');
const { MongoDB } = require('winston-mongodb');
const { LOG_LEVEL, CONNECTION_STRING } = require('../../config');

const consoleFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf(info => {
        const meta = (typeof info.message === 'object' && info.message !== null)
            ? info.message
            : info;
        return `[${info.timestamp}] [${info.level.toUpperCase()}]: ` +
            `[email:${meta.email}] ` +
            `[location:${meta.location}] ` +
            `[procType:${meta.procType}] ` +
            `[log:${JSON.stringify(meta.log)}]`;
    })
);

const logger = createLogger({
    level: LOG_LEVEL,
    transports: [
        new transports.Console({ format: consoleFormat }),
        new MongoDB({
            db: CONNECTION_STRING,
            collection: 'audit-logs',
            level: LOG_LEVEL,
            storeHost: false,
            tryReconnect: true,
            options: { useUnifiedTopology: true }
        })
    ]
});

module.exports = logger;