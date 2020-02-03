const testObj = {
    'type': 'loginreq',
    'room_id': '123',
    'dfl': 'sn@A=105@Sss@A=1',
    'username': 'visitor9986987',
    'uid': '1167614891',
    'ver': '20190610',
    'aver': '218101901',
    'ct': '0'
}

function isType(p, type) {
    return Object.prototype.toString.call(p).slice(8, -1).toLocaleLowerCase() === type.toLocaleLowerCase()
}

function escape(value) {
    value = value.toString()
    value = value.replace('@', '@A')
    value = value.replace('/', '@S')
    return value
}

function unescape(value) {
    value = value.toString()
    value = value.replace('@A', '@')
    value = value.replace('@S', '/')
    return value
}

function serialize(data) {
    if (isType(data, 'object')) {
        const arr = []
        for (let k in data) arr.push(`${escape(k)}@=${escape(data[k])}`)
        return arr.join('/') + '/'
    } else if (isType(data, 'array')) {
        return data.join('/') + '/'
    } else {
        return ''
    }
}

function deserialize(raw) {
    const result = {}
    if (typeof raw === 'undefined' || raw.length <= 0) {
        return result
    }

    kv_pairs = raw.split('/')
    for (let i in kv_pairs) {
        let temp = kv_pairs[i]
        if (temp.length === 0) {
            continue
        }

        temp = temp.split('@=')
        if (temp.length !== 2) {
            continue
        }

        const key = unescape(temp[0])
        let value = unescape(temp[1])
        if (!key) {
            continue
        }
        if (!value) {
            value = ''
        }
        try {
            if (value.includes('@=')) {
                value = deserialize(value)
            }
        } catch (e) {
            continue
        }
        result[key] = value
    }

    return result
}

module.exports = {
    testObj,
    isType,
    serialize,
    deserialize,
}