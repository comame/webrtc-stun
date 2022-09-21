// @ts-check

const dgram = require('node:dgram')
const { generateXorMappedAddress, generateAttribute } = require('./stunAttribute')
const { parseHeader, generateHeader } = require('./stunHeader')

const server = dgram.createSocket('udp4')

server.on('listening', () => {
    console.log('start')
})

server.on('message', (msgBuffer, remote) => {
    console.log(remote)

    const msg = new Uint8Array(msgBuffer.buffer)
    const header = parseHeader(msg.slice(0, 20))

    console.log(header)

    const xorMappedAddress = generateXorMappedAddress({
        family: 'ipv4',
        addr: remote.address,
        port: remote.port
    })

    const attribute = generateAttribute({
        type: 'XOR-MAPPED-ADDRESS',
        length: xorMappedAddress.length,
        value: xorMappedAddress
    })

    const responseHeader = generateHeader({
        ...header,
        class: 'success',
        length: attribute.length
    })

    end(new Uint8Array([ ...responseHeader, ...attribute ]), remote)
})

server.bind({
    port: 3478
})

function end(msg, remote) {
    server.send(msg, remote.port, remote.address)
}

process.on('SIGTERM', () => {
    server.close()
    process.exit(0)
})
