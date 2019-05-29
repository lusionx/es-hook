import { RequestOptions, IncomingMessage, request } from "http"
import * as Qs from 'querystring'
import { URL } from "url"
import { Readable } from "stream"

export function pass(opt: RequestOptions, stream: Readable) {
    return new Promise<IncomingMessage>((res, rej) => {
        const req = request(opt, res)
        stream.pipe(req)
        req.on('error', rej)
    })
}

/**
 * 读取全量buffer
 * @param stream
 */
export function read(stream: Readable) {
    return new Promise<Buffer>(res => {
        let d: Buffer = Buffer.alloc(0)
        stream.on('data', (chunk: Buffer) => {
            d = chunk
        })
        stream.on('end', () => res(d))
    })
}
