const { format, createLogger, transports } = require('winston');
const { MongoDB } = require('winston-mongodb');
const { LOG_LEVEL, CONNECTION_STRING } = require('../../config');

/**
 * Her iki çağrı pattern'ini tek bir yapıya normalize eder:
 *
 * Pattern 1 (route içinden): logger.info({ email, location, procType, log })
 *   → Winston tüm objeyi info.message yapar.
 *
 * Pattern 2 (httpLogger'dan): logger.info({ message: "GET /... 200", email, ... })
 *   → info.message zaten string, diğer alanlar info'nun üst seviyesinde.
 *
 * Bu transform sonrası her zaman:
 *   info.message  → string (konsola ve MongoDB'ye yazılır)
 *   info.email, info.location, info.procType, info.log → üst seviyede
 */
const normalizeLog = format((info) => {
    if (typeof info.message === 'object' && info.message !== null) {
        const { email, location, procType, log } = info.message;
        info.email = email;
        info.location = location;
        info.procType = procType;
        info.log = log;
        info.message = `${procType || ''} ${location || ''}`.trim();
    }
    return info;
});

// Konsol için insan okunabilir format
const consoleFormat = format.combine(
    normalizeLog(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf(info =>
        `[${info.timestamp}] [${info.level.toUpperCase()}]: ` +
        `[email:${info.email}] ` +
        `[location:${info.location}] ` +
        `[procType:${info.procType}] ` +
        `[log:${JSON.stringify(info.log)}]`
    )
);

// MongoDB için yapılandırılmış format:
// normalizeLog  → obje pattern'ini düzleştirir
// metadata      → düz alanları metadata altına toplar (winston-mongodb için)
const mongoFormat = format.combine(
    normalizeLog(),
    format.timestamp(),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

const logger = createLogger({
    level: LOG_LEVEL,
    transports: [
        new transports.Console({ format: consoleFormat }),
        new MongoDB({
            db: CONNECTION_STRING,
            collection: 'audit-logs',
            level: LOG_LEVEL,
            format: mongoFormat,
            storeHost: false,
            tryReconnect: true
        })
    ]
});

module.exports = logger;