const util = require('./util')

class STT {
    escape(v) {
        return v.toString().replace(/@/g, '@A').replace(/\//g, '@S');
    }

    unescape(v) {
        return v.toString().replace(/@S/g, '/').replace(/@A/g, '@');
    }

    serialize(raw) {
        if (util.isObject(raw)) {
            return Object.entries(raw)
                .map(([k, v]) => `${k}@=${this.serialize(v)}`)
                .join('');
        } else if (Array.isArray(raw)) {
            return raw.map(v => `${this.serialize(v)}`).join('');
        } else {
            return this.escape(raw.toString()) + '/';
        }
    }

    deserialize(raw) {
        if (raw.includes('//')) {
            return raw.split('//')
                .filter(e => e !== '')
                .map(item => this.deserialize(item));
        }

        if (raw.includes('@=')) {
            return raw.split('/')
                .filter(e => e !== '')
                .reduce((o, s) => {
                    const [k, v] = s.split('@=');
                    return o[k] = this.deserialize(v), o;
                }, {});
        } else {
            return this.unescape(raw);
        }
    }
}

module.exports = new STT()
