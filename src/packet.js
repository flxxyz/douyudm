class Packet {
    static HEADER_LEN_SIZE = 4
    static HEADER_LEN_TYPECODE = 2
    static HEADER_LEN_ENCRYPT = 1
    static HEADER_LEN_PLACEHOLDER = 1
    static HEADER_LEN_TOTAL = this.HEADER_LEN_SIZE * 2 +
        this.HEADER_LEN_TYPECODE +
        this.HEADER_LEN_ENCRYPT +
        this.HEADER_LEN_PLACEHOLDER

    static buffer = Buffer.alloc(0)

    static Encode(data) {
        const msgHeader = Buffer.alloc(this.HEADER_LEN_TOTAL)
        const msgBody = Buffer.from(data, 'utf8')
        const msgTotalLen = msgBody.length + this.HEADER_LEN_TOTAL + 1
        msgHeader.writeInt32LE(msgTotalLen - this.HEADER_LEN_SIZE, 0)
        msgHeader.writeInt32LE(msgTotalLen - this.HEADER_LEN_SIZE, 4)
        msgHeader.writeInt16LE(689, 8)
        return Buffer.concat([msgHeader, msgBody], msgTotalLen)
    }

    static Decode(buf, callback) {
        this.buffer = Buffer.concat([this.buffer, buf], this.buffer.length + buf.length)
        for (let offset = 0; this.buffer.length > 0; offset = 0) {
            if (0 === offset) {
                if (this.buffer.length < this.HEADER_LEN_SIZE) return;
                offset = this.buffer.readInt32LE(this.HEADER_LEN_SIZE)
                this.buffer = this.buffer.slice(this.HEADER_LEN_SIZE)
            }

            if (this.buffer.length < offset) return;

            const message = this.buffer.slice(this.HEADER_LEN_SIZE * 2, offset - 1).toString('utf8')
            this.buffer = this.buffer.slice(offset)
            callback(message)
        }
    }
}

module.exports = Packet