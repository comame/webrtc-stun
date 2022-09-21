// @ts-check

const { uint8ArrayToNumber, numberToUint8Array } = require('./conv')

const MAGIC_COOKIE = 0x2112A442
const MAGIC_COOKIE_BY_BYTE = [ 0x21, 0x12, 0xa4, 0x42 ]

/** @typedef {{ type: string, length: number, value: Uint8Array }} StunAttribute */

/** @type { [ number, string ][] } */
const attributes = [
    [ 0x0001, 'MAPPED-ADDRESS' ],
    [ 0x0006, 'USERNAME' ],
    [ 0x0008, 'MESSAGE-INTEGRITY' ],
    [ 0x0009, 'ERROR-CODE' ],
    [ 0x000A, 'UNKNOWN-ATTRIBUTES' ],
    [ 0x0014, 'REALM' ],
    [ 0x0015, 'NONCE' ],
    [ 0x0020, 'XOR-MAPPED-ADDRESS' ]
]

/**
 * @param { number } code
 * @returns { string | null }
 */
function getAttributeName(code) {
    const name = attributes.find(it => it[0] === code)
    if (!name) {
        return null
    }
    return name[1]
}

/**
 * @param { string } name
 * @returns { number | null }
 */
function getAttributeCode(name) {
    const attr = attributes.find(it => it[1] === name)
    if (!attr) {
        return null
    }
    return attr[0]
}

/**
 * @param { Uint8Array } uint8Array
 * @returns { StunAttribute }
 */
function parseAttribute(uint8Array) {
    const type = uint8ArrayToNumber(uint8Array.slice(0, 2))
    const length = uint8ArrayToNumber(uint8Array.slice(2, 4))

    const value = uint8Array.slice(4, 4 + length)

    const typeName = getAttributeName(type)

    if (!typeName) {
        throw new TypeError('Invalid Attribute type')
    }

    return {
        type: typeName, length, value
    }
}

/**
 * @param { StunAttribute } attribute
 * @returns { Uint8Array }
 **/
function generateAttribute(attribute) {
    /** @type { number[] } */
    const arr = []

    if (attribute.length !== attribute.value.length) {
        throw new TypeError('Invalid Attribute value length')
    }

    const typeCode = getAttributeCode(attribute.type)
    if (!typeCode) {
        throw new TypeError('Invalid Attribute Code')
    }
    arr.push(...numberToUint8Array(typeCode, 2))

    arr.push(...numberToUint8Array(attribute.length, 2))

    arr.push(...attribute.value)

    // Padding
    while (arr.length % 4 !== 0) {
        arr.push(0)
    }

    return new Uint8Array(arr)
}

/**
 * @returns { Uint8Array }
 * @param {{ family: 'ipv4'|'ipv6', port: number, addr: string }} value
 */
function generateXorMappedAddress(value) {
    const ipv4Regex = /\d{1,3}\.\d{1,3}.\d{1,3}.\d{1,3}/

    if (value.family === 'ipv6') {
        throw new Error('ipv6 is not implemented')
    }

    if (!ipv4Regex.test(value.addr)) {
        throw new TypeError('Invalid ipv4 format')
    }

    const xorPort = 0x2112 ^ value.port

    const addr = value.addr.split('.').map(it => Number.parseInt(it, 10))
    const xorAddr = addr.map((v, i) => v ^ MAGIC_COOKIE_BY_BYTE[i])

    return new Uint8Array([ 0, 0x01, ...numberToUint8Array(xorPort, 2), ...xorAddr ])
}

/**
 * @param { Uint8Array } uint8Array
 * @returns { Uint8Array }
 */
function removePadding(uint8Array) {
    const arr = Array.from(uint8Array)
    for (let i = arr.length - 1; i >= 0; i -= 1) {
        if (arr[i] !== 0) {
            arr.splice(i, 1)
        } else {
            break
        }
    }
    return new Uint8Array(arr)
}

module.exports = { parseAttribute, generateAttribute, generateXorMappedAddress }
