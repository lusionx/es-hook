import { RequestOptions, IncomingMessage, request } from "http"
import * as Qs from 'querystring'
import { URL } from "url"
import { Readable } from "stream"

export function pass(opt: RequestOptions, stream?: Readable) {
    return new Promise<IncomingMessage>((res, rej) => {
        const req = request(opt, res)
        stream ? stream.pipe(req) : req.end()
        req.on('error', rej)
    })
}
