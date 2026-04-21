const { format, createLogger, transports } = require('winston');
const { LOG_LEVEL } = require('../../config');

const formats = format.combine(
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
        new (transports.Console)({ format: formats })
    ]
})

module.exports = logger;