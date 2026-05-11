const { format, createLogger, transports } = require('winston');
const { MongoDB } = require('winston-mongodb');
const { LOG_LEVEL, CONNECTION_STRING } = require('../../config');
const c = require('../colors');

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

// Level → renk fonksiyonu eşlemesi (tek tanım, tekrar yok)
const LEVEL_COLOR = {
    error: c.error,
    warn: c.warn,
    info: c.ok,
    http: c.cyan,
    verbose: c.gray,
    debug: c.blue,
    silly: c.gray,
};

// Konsol için renkli, insan okunabilir format
const consoleFormat = format.printf(info => {
    const colorize = LEVEL_COLOR[info.level] ?? (t => t);
    const level = colorize(`[${info.level.toUpperCase()}]`);
    const timestamp = c.gray(`[${info.timestamp}]`);
    const email = c.user(info.email ?? '-');
    const location = c.tag(info.location ?? '-');
    const procType = c.priv(info.procType ?? '-');
    const log = c.gray(JSON.stringify(info.log ?? info.message));

    return `${timestamp} ${level} ${email} ${location} ${procType} ${log}`;
});

// MongoDB için yapılandırılmış format:
// metadata      → düz alanları metadata altına toplar (winston-mongodb için)
const mongoFormat = format.combine(
    format.json(),
);

const logger = createLogger({
    level: LOG_LEVEL,
    format: format.combine(
        normalizeLog(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    ),
    transports: [
        new transports.Console({ format: consoleFormat }),
        new MongoDB({
            db: CONNECTION_STRING,
            collection: 'audit-logs',
            level: LOG_LEVEL,
            format: mongoFormat,
            storeHost: false,
            tryReconnect: true,
        })
    ]
});

module.exports = logger;