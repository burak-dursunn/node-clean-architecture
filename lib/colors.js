/**
 * Minimal ANSI renk yardımcısı — sıfır bağımlılık.
 * Üretimde NO_COLOR=true env değişkeni ile tamamen devre dışı bırakılabilir.
 *
 * Kullanım:
 *   const c = require('./colors');
 *   console.log(c.green('Başarılı'));
 *   console.log(c.tag('checkPrivilege') + c.warn(' → ACCESS DENIED'));
 */

const ENABLED = process.env.NO_COLOR !== 'true' && process.stdout.isTTY !== false;

const ESC = '\x1b';
const RESET = `${ESC}[0m`;

function wrap(code, text) {
    return ENABLED ? `${ESC}[${code}m${text}${RESET}` : text;
}

// ── Temel renkler ──────────────────────────────────────────
const c = {
    reset: text => wrap('0', text),

    // Metin renkleri
    black: text => wrap('30', text),
    red: text => wrap('31', text),
    green: text => wrap('32', text),
    yellow: text => wrap('33', text),
    blue: text => wrap('34', text),
    magenta: text => wrap('35', text),
    cyan: text => wrap('36', text),
    white: text => wrap('37', text),
    gray: text => wrap('90', text),

    // Kalın (bold)
    bold: text => wrap('1', text),

    // Arkaplan renkleri
    bgRed: text => wrap('41', text),
    bgGreen: text => wrap('42', text),
    bgBlue: text => wrap('44', text),

    // ── Anlam bazlı kısayollar ──────────────────────────────
    /** Başarı mesajı — yeşil */
    ok: text => wrap('32', text),
    /** Uyarı mesajı — sarı */
    warn: text => wrap('33', text),
    /** Hata mesajı — kalın kırmızı */
    error: text => wrap('1;31', text),
    /** Bilgi mesajı — cyan */
    info: text => wrap('36', text),
    /** Middleware/modül etiketi — magenta köşeli parantez */
    tag: text => wrap('35', `[${text}]`),
    /** Kullanıcı adı — mavi */
    user: text => wrap('34', text),
    /** Privilege adı — cyan+kalın */
    priv: text => wrap('1;36', text),
    /** HTTP durumu — yeşil/sarı/kırmızı */
    status: code => {
        if (code < 300) return wrap('32', String(code));
        if (code < 400) return wrap('33', String(code));
        return wrap('31', String(code));
    }
};

module.exports = c;

/* 
const c = require('../lib/colors');

// Temel renkler
console.log(c.green('Başarılı'));
console.log(c.red('Hata'));
console.log(c.yellow('Uyarı'));
console.log(c.gray('Gri not'));
console.log(c.bold('Kalın'));

// Anlam bazlı kısayollar
console.log(c.ok('✔ İşlem tamamlandı'));      // yeşil
console.log(c.warn('⚠ Dikkat'));               // sarı
console.log(c.error('✘ Kritik hata'));         // kırmızı + kalın
console.log(c.tag('modülAdı'));                // [modülAdı] — magenta
console.log(c.user('Burak Dursun'));           // mavi
console.log(c.priv('category_view'));          // cyan + kalın
console.log(c.status(200));                    // yeşil "200"
console.log(c.status(403));                    // kırmızı "403"

*/
