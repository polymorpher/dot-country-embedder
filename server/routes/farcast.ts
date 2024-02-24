import express, { type Request, type Response, type NextFunction } from 'express'
import { getSSLHubRpcClient, Message } from '@farcaster/hub-nodejs'
import config from '../config.ts'
import axios, { HttpStatusCode } from 'axios'
import {
  lookupFid,
  renderImageResponse,
  renderMintFailed,
  renderMintSuccess
} from '../src/farcaster.ts'
import { LRUCache } from 'lru-cache'
import { parsePageSetting } from '../src/util.ts'
import { uploadFile, fileExist, getMapUrl } from '../src/gcp.ts'
import ethers from 'ethers'
const client = config.farcast.hubUrl ? getSSLHubRpcClient(config.farcast.hubUrl) : undefined

const router = express.Router()

const base = axios.create({ timeout: 5000 })
const getOriginalHost = (s: string): string => {
  s = s.substring(config.farcast.postUrlSubdomainPrefix.length)
  if (s.startsWith('-')) {
    s = s.slice(1)
  }
  return s
}

const authMessage = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const host = req.get('host')
  // console.log('[authMessage]', host, req.headers)
  // console.log('[authMessage] body', JSON.stringify(req.body))
  if (!host?.startsWith(config.farcast.postUrlSubdomainPrefix)) {
    return res.status(HttpStatusCode.BadRequest).send(`Invalid host: ${host}`).end()
  }
  const originalHost = getOriginalHost(host)
  let validatedMessage: Message | undefined
  try {
    const frameMessage = Message.decode(Buffer.from(req.body?.trustedData?.messageBytes || '', 'hex'))
    // console.log('frameMessage', frameMessage)
    // console.log('client', client)
    const result = await client?.validateMessage(frameMessage)
    // console.log('result', result)
    if (result?.isOk() && result.value.valid) {
      validatedMessage = result.value.message
    }

    // Also validate the frame url matches the expected url
    const urlBuffer = validatedMessage?.data?.frameActionBody?.url ?? new Uint8Array([])
    const urlString = Buffer.from(urlBuffer).toString('utf-8')
    const url = new URL(urlString)
    if (validatedMessage && url.host !== originalHost) {
      console.error('[authMessage] bad url', { originalHost, urlHost: url.host })
      return res.status(HttpStatusCode.BadRequest).send(`Invalid frame url: ${urlBuffer}`).end()
    }
  } catch (e) {
    return res.status(HttpStatusCode.BadRequest).send(`Failed to validate message: ${e}`).end()
  }
  req.validatedMessage = validatedMessage
  next()
}

const getPageSetting = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    req.domainInfo = await parsePageSetting(req.hostname)
    next()
  } catch (ex: any) {
    console.error('[getPageSetting] ', ex)
    res.status(HttpStatusCode.InternalServerError).send('Cannot retrieve domain info based on hostname').end()
  }
}
router.post('/callback', authMessage, getPageSetting, async (req, res): Promise<any> => {
  const host = req.get('host')
  // console.log('[/farcast/callback] validatedMessage', validatedMessage)
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const fid = req.validatedMessage.data?.fid
  if (!fid) {
    console.error('[/farcast/callback] No fid found in validatedMessage')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  // TODO: mint stuff
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { owner } = await lookupFid(fid)

  // res.send(renderMintFailed(`${req.protocol}://${host}/${config.farcast.postUrlPath}/redirect`)).end()
  res.send(renderMintSuccess()).end()
  // respond a new frame
})

router.post('/callback/redirect', async (req, res) => {
  console.log('[/callback/redirect] body', JSON.stringify(req.body))
  const host = getOriginalHost(req.get('host') ?? '')
  const target = `https://${host}/`
  console.log(`[/callback/redirect] Redirecting to ${target}`)
  res.redirect(target)
})

if (config.debug) {
  router.get('/callback', async (req, res) => {
    const host = req.get('host')
    console.log(host, req.protocol)
    if (req.query.fail === '1') {
      return res.send(renderMintFailed(`${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`))
    }
    res.send(renderMintSuccess()).end()
  })
}

const tokenCache = new LRUCache<string, string>({
  max: 5000,
  maxSize: 50000,
  sizeCalculation: (value, key) => {
    return 1
  },
  ttl: 1000 * 60
})

router.post('/map/callback', authMessage, getPageSetting, async (req, res) => {
  const host = req.get('host')
  // console.log('[/farcast/callback] validatedMessage', validatedMessage)
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const input = req.validatedMessage.data?.frameActionBody?.inputText
  console.log('input', input)
  console.log('req.validatedMessage.data', req.validatedMessage.data)
  if (!input) {
    console.error('[/map/callback] Validated data has no user input')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const location = new TextDecoder().decode(input)

  // TODO: actually mint the token

  const token = ethers.utils.id(`${location}${req.domainInfo?.farcastMap}`)
  const exist = await fileExist(`${token}.png`)
  console.log(`Generated token ${token} for location=${location}, suffix=${req.domainInfo?.farcastMap}`)
  tokenCache.set(token, location)
  if (!exist) {
    const mapUrl = getMapUrl(location, req.domainInfo?.farcastMap)
    const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
    await uploadFile(Buffer.from(data), `${token}.png`)
  }
  const image = `https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`
  const html = renderImageResponse(image, `You earned $MAP! Checkout ${host}`, 'link', `${req.protocol}://${host}`)
  res.send(html).end()
})

// if (config.debug) {
//   router.get('/map/callback', getPageSetting, async (req, res) => {
//     const host = req.hostname
//     const location = req.query.location as string
//     const token = ethers.utils.id(`${location}${req.domainInfo?.farcastMap}`)
//     console.log(`[DEBUG] token ${token} for location=${location}, suffix=${req.domainInfo?.farcastMap}`)
//     const exist = await fileExist(`${token}.png`)
//     if (!exist) {
//       const mapUrl = getMapUrl(location, req.domainInfo?.farcastMap)
//       const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
//       await uploadFile(Buffer.from(data), `${token}.png`)
//     }
//     const image = `https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`
//     const html = renderImageResponse(image, `You just earned $MAP! Checkout ${host}`, 'link', `${req.protocol}://${host}`)
//     res.send(html).end()
//   })
// }

// alternative way of generating image - makes frame response faster, generate and cache image later when image is requested
router.get('/map/image', async (req, res) => {
  const token = req.query.token?.toString()
  if (!token) {
    return res.status(HttpStatusCode.BadRequest).send('No token').end()
  }
  const location = tokenCache.get(token)
  if (!location) {
    return res.status(HttpStatusCode.BadRequest).send(`Bad token ${token}`).end()
  }
  const refresh = !!req.query.r
  const exist = await fileExist(`${token}.png`)
  if (exist && !refresh) {
    res.redirect(`https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`)
    return
  }
  const mapUrl = getMapUrl(location)
  const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
  res.type('png')
  res.send(Buffer.from(data)).end()
  await uploadFile(Buffer.from(data), `${token}.png`)
})

export default router
