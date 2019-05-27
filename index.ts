import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'
import { pass, } from './lib'
import { createClient, RedisClient } from 'redis'

let config: Bind
let cli: RedisClient
function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: oriUrl, method } = req
    const oriLoc = new URL(config.pass + oriUrl)
    console.log(oriLoc.href)
    console.log(headers)
    pass({
        hostname: oriLoc.hostname,
        port: oriLoc.port, method, headers,
        path: oriLoc.pathname + oriLoc.search
    }, req.readableLength ? req : undefined).then(pxy => {
        res.writeHead(pxy.statusCode || 500, pxy.headers)
        const bf = pxy.read()
        const ss = bf.toString()
        console.log(ss)
        if (oriLoc.pathname.endsWith('/_update')) {
            if (pxy.statusCode === 200 || pxy.statusCode === 201) {
                cli.publish(config.redis.key, ss)
            }
        }
        res.end(bf)
    }).catch((err: Error) => {
        res.writeHead(502, {
            'Content-Length': err.message.length,
            'Content-Type': 'text/plain',
        })
        res.write(err.message)
        res.end()
    })
}

interface Bind {
    port: number
    pass: string
    redis: {
        url: string
        key: string
    }
}

process.nextTick(async () => {
    config = JSON.parse(readFileSync(process.argv[2] || './config.dev.json', { encoding: 'utf8' }))
    cli = createClient({ url: config.redis.url })
    createServer(listener).listen(config.port)
    console.log('listen http://127.0.0.1:' + config.port)
})

process.on("unhandledRejection", (error: any) => {
    const { response, config } = error
    if (config && response) {
        return console.error({ config, data: response.data })
    }
    console.error(error)
})
