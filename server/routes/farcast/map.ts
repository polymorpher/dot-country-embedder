// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Message } from '@farcaster/hub-nodejs'
import { DCRewardTokenId, mint, queue, safeGetBalance } from '../../src/dc-reward.js'
import ethers, { type ContractTransaction } from 'ethers'
import { fileExist, getMapUrl, uploadFile } from '../../src/gcp.js'
import { base, tokenCache } from './utils.js'
import { HttpStatusCode } from 'axios'
import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import {
  lookupFid,
  renderMintFailed,
  renderImageResponse,
  computeButtonDisplayedLocation
} from '../../src/farcaster.js'
import { redisClient } from '../../src/redis.js'

router.post('/map/callback', authMessage, getPageSetting, async (req, res) => {
  // console.log('ip', req.headers['x-forwarded-for'] ?? req.socket.remoteAddress)
  const host = req.get('host')
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  // console.log('[/map/callback] validatedMessage', JSON.stringify(Message.toJSON(req.validatedMessage)))
  const input = req.validatedMessage.data?.frameActionBody?.inputText
  // console.log('input', input)
  // console.log('req.validatedMessage.data', req.validatedMessage.data)
  if (!input) {
    console.error('[/map/callback] Validated data has no user input')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  let location: string | undefined = ''
  if (req.query.token) {
    location = tokenCache.get(req.query.token as string)
    if (!location) {
      return res.status(HttpStatusCode.BadRequest).send(`Bad token ${req.query.token as string}`).end()
    }
  } else {
    location = new TextDecoder().decode(input)
  }

  const fid = req.validatedMessage.data?.fid
  if (!fid) {
    console.error('[/farcast/map/callback] No fid found in validatedMessage')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const { owner, username } = await lookupFid(fid)
  if (!config.farcast.mockMinting) {
    queue.add(async () => await mint(owner, DCRewardTokenId.MAP)).then(async (tx) => {
      console.log('[/farcast/map/callback] mint $MAP: ', (tx as ContractTransaction).hash)
      await redisClient.incr(`${config.redis.prefix}:farcast-map:supply`)
      await redisClient.zAdd(`${config.redis.prefix}:farcast-map:mints`, [{ score: Date.now(), value: `${fid.toString()}-${Date.now()}` }])
    }).catch(ex => {
      console.error('[/farcast/map/callback] error', ex)
    })
  }
  if (config.farcast.mockMinting) {
    redisClient.incr(`${config.redis.prefix}:farcast-map:supply`).catch(console.error)
    redisClient.zAdd(`${config.redis.prefix}:farcast-map:mints`, [{
      score: Date.now(),
      value: fid.toString()
    }]).catch(console.error)
  }

  // TODO: return a status-checking frame instead, let user click a refresh button to see if mint is successful

  let combinedLocation = req.query.token ? location : `${location}${req.domainInfo?.farcastMap}`
  if (!req.query.token && req.domainInfo?.farcastMap?.startsWith('??')) {
    if (location.includes(',')) {
      combinedLocation = location
    } else {
      combinedLocation = `${location}${req.domainInfo?.farcastMap?.substring(2)}`
    }
  }

  const token = ethers.utils.id(`${location}${req.domainInfo?.farcastMap}`)
  const exist = await fileExist(`${token}.png`)
  console.log(`Generated token ${token} for combinedLocation=${combinedLocation} | suffix=${req.domainInfo?.farcastMap}`)
  tokenCache.set(token, combinedLocation)
  if (!exist) {
    const mapUrl = getMapUrl(location, combinedLocation === location ? '' : req.domainInfo?.farcastMap)
    const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
    await uploadFile(Buffer.from(data), `${token}.png`)
  }
  const image = `https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`

  const balance = await safeGetBalance(owner, DCRewardTokenId.MAP)

  const buttonDisplayedLocation = computeButtonDisplayedLocation(location, req.domainInfo?.farcastMap)

  const text = `${username}: ${balance >= 0 ? balance + 1 : 'N/A'} $MAP @ ${buttonDisplayedLocation}`

  const html = renderImageResponse(image, text, 'link', `${req.protocol}://${host}`)
  res.send(html).end()
})

if (config.debug) {
  router.get('/map/callback', getPageSetting, async (req, res) => {
    const host = req.hostname
    const location = req.query.location as string
    const token = ethers.utils.id(`${location}${req.domainInfo?.farcastMap}`)
    console.log(`[DEBUG] token ${token} for location=${location}, suffix=${req.domainInfo?.farcastMap}`)
    const exist = await fileExist(`${token}.png`)
    if (!exist) {
      const mapUrl = getMapUrl(location, req.domainInfo?.farcastMap)
      const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
      await uploadFile(Buffer.from(data), `${token}.png`)
    }
    const image = `https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`
    const html = renderImageResponse(image, 'You earned $MAP! Checkout our site', 'link', `${req.protocol}://${host}`)
    res.send(html).end()
  })
}

// alternative way of generating image - makes frame response faster, generate and cache image later when image is requested
router.get('/map/image', async (req, res) => {
  const token = req.query.token?.toString()
  if (!token) {
    return res.status(HttpStatusCode.BadRequest).send('No token').end()
  }
  const combinedLocation = tokenCache.get(token)
  if (!combinedLocation) {
    return res.status(HttpStatusCode.BadRequest).send(`Bad token ${token}`).end()
  }
  const refresh = !!req.query.r
  const exist = await fileExist(`${token}.png`)
  if (exist && !refresh) {
    res.redirect(`https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`)
    return
  }
  const mapUrl = getMapUrl(combinedLocation, '')
  const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
  res.type('png')
  res.send(Buffer.from(data)).end()
  await uploadFile(Buffer.from(data), `${token}.png`)
})

router.post('/map/review', authMessage, getPageSetting, async (req, res) => {
  // console.log('ip', req.headers['x-forwarded-for'] ?? req.socket.remoteAddress)
  const host = req.get('host')
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const input = req.validatedMessage.data?.frameActionBody?.inputText
  if (!input) {
    console.error('[/farcast/map/review] Validated data has no user input')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const location = new TextDecoder().decode(input)
  let combinedLocation = `${location}${req.domainInfo?.farcastMap}`
  if (req.domainInfo?.farcastMap?.startsWith('??')) {
    if (location.includes(',')) {
      combinedLocation = location
    } else {
      combinedLocation = `${location}${req.domainInfo?.farcastMap?.substring(2)}`
    }
  }

  const token = ethers.utils.id(`${location}${req.domainInfo?.farcastMap}`)
  const exist = await fileExist(`${token}.png`)
  console.log(`Generated token ${token} for combinedLocation=${combinedLocation} | suffix=${req.domainInfo?.farcastMap}`)
  tokenCache.set(token, combinedLocation)
  if (!exist) {
    const mapUrl = getMapUrl(location, combinedLocation === location ? '' : req.domainInfo?.farcastMap)
    const { data } = await base.get(mapUrl, { responseType: 'arraybuffer' })
    await uploadFile(Buffer.from(data), `${token}.png`)
  }
  const image = `https://storage.googleapis.com/${config.google.storage.bucket}/${token}.png`
  const nextTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/map/callback?token=${token}`
  const html = renderImageResponse(image, 'Submit review, earn $MAP', 'post', nextTarget, 'Your review of this place')
  res.send(html).end()
})
