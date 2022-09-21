// @ts-check

/**
 * @param { Uint8Array } uint8Array
 * @returns { boolean[] }
 **/
function uint8ArrayToBits(uint8Array) {
    const bits = []
    for (const byte of uint8Array) {
        for (let i = 0; i < 8; i += 1) {
            const bit = byte & (1 << (7 - i)) // big endian
            bits.push(bit === 1)
        }
    }
    return bits
}

/**
 * @param { Uint8Array } uint8Array
 * @returns { number }
 */
function uint8ArrayToNumber(uint8Array) {
    let ans = 0
    for (let i = 0; i < uint8Array.length; i += 1) {
        ans += uint8Array[i] << (8 * (uint8Array.length - i - 1))
    }
    return ans
}

/**
 * @param { boolean[] } bits
 * @returns { number }
 */
function bitsToNumber(bits) {
    let ans = 0
    for (let i = 0; i < bits.length; i += 1) {
        ans += (bits[i] ? 1 : 0) << (bits.length - 1 - i)
    }
    return ans
}

/**
 * @param { number } number
 * @param { number } bytes
 * @returns { Uint8Array }
 */
function numberToUint8Array(number, bytes) {
    let hex = number.toString(16)
    if (hex.length % 2 !== 0) {
        hex = '0' + hex
    }

    let bytesStr = []
    for (let i = 0; i < hex.length; i += 2) {
        bytesStr.push(hex[i] + hex[i + 1])
    }

    while (bytesStr.length < bytes) {
        bytesStr.unshift('00')
    }

    return new Uint8Array(bytesStr.map(byte => Number.parseInt(byte, 16)))
}

module.exports = {
    uint8ArrayToBits,
    uint8ArrayToNumber,
    numberToUint8Array,
    bitsToNumber
}
