import { RequestOptions, IncomingMessage, request } from "http"
import * as Qs from 'querystring'
import { URL } from "url"
import { Readable } from "stream"

export function pass(opt: RequestOptions, bf: Buffer) {
    return new Promise<IncomingMessage>((res, rej) => {
        const req = request(opt, res)
        req.end(bf)
        req.on('error', rej)
    })
}

export function read(stream: Readable) {
    return new Promise<Buffer>(res => {
        let d: Buffer = Buffer.alloc(0)
        stream.on('data', (chunk: Buffer) => {
            d = chunk
        })
        stream.on('end', () => res(d))
    })
}
