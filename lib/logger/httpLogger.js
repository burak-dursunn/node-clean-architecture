const logger = require('./logger');

/**
 * HTTP istek/yanıt loglarını otomatik olarak yakalayan Express middleware.
 * Her gelen istek için method, URL, statusCode, süre ve kullanıcı bilgisini loglar.
 * Kimlik doğrulanmış isteklerde req.user, anonim isteklerde 'anonymous' kullanılır.
 *
 * Route dosyalarına tek satır logger kodu yazmak gerekmez; bu middleware
 * app.js'te kayıt edildiği için tüm istekleri otomatik olarak yakalar.
 */
const httpLogger = (req, res, next) => {
    const startTime = Date.now();

    // Yanıt tamamlandığında çalışır (hem başarılı hem hatalı durumlar)
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        const logData = {
            message: `${req.method} ${req.originalUrl} ${statusCode}`,
            email: req.user?.email || 'anonymous',
            location: req.originalUrl,
            procType: req.method,
            log: {
                statusCode,
                duration: `${duration}ms`,
                ip: req.ip
            }
        };

        // logger.http() yerine info/warn/error: winston-mongodb ile tam uyumlu
        if (statusCode >= 500) {
            logger.error(logData);
        } else if (statusCode >= 400) {
            logger.warn(logData);
        } else {
            logger.info(logData);  // http → info (DB uyumluluk için)
        }
    });

    next();
};

module.exports = httpLogger;
