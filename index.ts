import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'
import { pass, read, } from './lib'
import { createClient, RedisClient } from 'redis'

let config: Bind
let cli: RedisClient

async function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: oriUrl, method } = req
    const oriLoc = new URL(config.pass + oriUrl)
    pass({
        hostname: oriLoc.hostname,
        port: oriLoc.port, method, headers,
        path: oriLoc.pathname + oriLoc.search
    }, req).then(pxy => {
        res.writeHead(pxy.statusCode || 500, pxy.headers)
        const bf = pxy.read()
        if (oriLoc.pathname.endsWith('/_update')) {
            const ss = bf.toString()
            if (pxy.statusCode === 200 || pxy.statusCode === 201) {
                const [, _index, _type,] = oriLoc.pathname.split('/')
                cli.publish([config.redis.key, _index,].join('/'), ss)
                cli.publish([config.redis.key, _index, pxy.statusCode].join('/'), ss)
                cli.publish([config.redis.key, _index, _type].join('/'), ss)
                cli.publish([config.redis.key, _index, _type, pxy.statusCode].join('/'), ss)
            }
        }
        res.write(bf)
        res.end()
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
