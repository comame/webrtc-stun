// @ts-check

const { bitsToNumber, uint8ArrayToBits, uint8ArrayToNumber, numberToUint8Array } = require('./conv')

const MAGIC_COOKIE = 0x2112A442

/** @typedef {{ class: "request"|"indication"|"success"|"error", method: 'binding', length: number, transactionId: string }} StunHeader */

/**
 * @param { Uint8Array } msg
 * @returns { StunHeader }
 * */
function parseHeader(msg) {
    const messageType = uint8ArrayToBits(msg.slice(0, 2))

    const classSpec = bitsToNumber([messageType[7], messageType[11]])

    /** @type { StunHeader["class"] | null } */
    let className = null
    switch (classSpec) {
        case 0b00: {
            className = 'request'
            break
        }
        case 0b01: {
            className = 'indication'
            break
        }
        case 0b10: {
            className = 'success'
            break
        }
        case 0b11: {
            className = 'error'
            break
        }
        default: {
            throw new TypeError('Invalid class')
        }
    }

    const method = bitsToNumber([...messageType.slice(2, 7), ...messageType.slice(8, 11), ...messageType.slice(12, 16)])
    /** @type { StunHeader['method'] | null} */
    let methodName = null
    switch (method) {
        case 0b000000000001: {
            methodName = 'binding'
            break
        }
        default: {
            throw new TypeError('Invalid method')
        }
    }

    const messageLength = uint8ArrayToNumber(msg.slice(2, 4))

    const magicCookie = uint8ArrayToNumber(msg.slice(4, 8))

    const transactionId = Array.from(msg.slice(8, 20)).map(it => it.toString(16)).join('')

    if (messageType[0] || messageType[1]) {
        throw new TypeError('Most significant 2 bits are not 0')
    }

    if (magicCookie !== MAGIC_COOKIE) {
        throw new TypeError('Invalid Magic Cookie')
    }

    return {
        class: className,
        method: methodName,
        length: messageLength,
        transactionId
    }
}

/**
 * @param {StunHeader} header
 * @returns {Uint8Array}
 */
function generateHeader(header) {
    const arr = []

    let classNumber = 0

    if (header.class === 'request') {
        classNumber = 0b00
    } else if (header.class === 'indication') {
        classNumber = 0b01
    } else if (header.class === 'success') {
        classNumber = 0b10
    } else if (header.class === 'error') {
        classNumber = 0b11
    }

    let methodNum = 0
    if (header.method === 'binding') {
        methodNum = 0b000000000001
    }

    const messageType =
        ((0b111110000000 & methodNum) << 9) +
        ((0b000001110000 & methodNum) << 5) +
        ((0b000000001111 & methodNum) << 0) +
        ((0b10 & classNumber) << 7) +
        ((0b01 & classNumber) << 4)

    console.log(classNumber, messageType.toString(16))
    console.log(messageType.toString(2))

    arr.push(...numberToUint8Array(messageType, 2))
    arr.push(...numberToUint8Array(header.length, 2))
    arr.push(...numberToUint8Array(MAGIC_COOKIE, 4))
    arr.push(...numberToUint8Array(Number.parseInt(header.transactionId.slice(0, 8), 16), 4))
    arr.push(...numberToUint8Array(Number.parseInt(header.transactionId.slice(8, 16), 16), 4))
    arr.push(...numberToUint8Array(Number.parseInt(header.transactionId.slice(16, 24), 16), 4))

    return new Uint8Array(arr)
}

module.exports = { parseHeader, generateHeader }
