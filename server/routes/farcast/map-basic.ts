import { Message } from '@farcaster/hub-nodejs'
import { DCRewardTokenId, mint, queue } from '../../src/dc-reward.js'
import ethers, { type ContractTransaction } from 'ethers'
import { fileExist, getMapUrl, uploadFile } from '../../src/gcp.js'
import { base, tokenCache } from './utils.js'
import { HttpStatusCode } from 'axios'
import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import { lookupFid, renderMintFailed, renderImageResponse } from '../../src/farcaster.js'

router.post('/map-basic/callback', authMessage, getPageSetting, async (req, res) => {
  // console.log('ip', req.headers['x-forwarded-for'] ?? req.socket.remoteAddress)
  const host = req.get('host')
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  console.log('[/farcast/map-basic/callback] validatedMessage', JSON.stringify(Message.toJSON(req.validatedMessage)))
  const input = req.validatedMessage.data?.frameActionBody?.inputText
  // console.log('input', input)
  // console.log('req.validatedMessage.data', req.validatedMessage.data)
  if (!input) {
    console.error('[/farcast/map-basic/callback] Validated data has no user input')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const location = new TextDecoder().decode(input)

  const fid = req.validatedMessage.data?.fid
  if (!fid) {
    console.error('[/farcast/map-basic/callback] No fid found in validatedMessage')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const { owner } = await lookupFid(fid)
  if (!config.farcast.mockMinting) {
    queue.add(async () => await mint(owner, DCRewardTokenId.COUNTRY)).then((tx) => {
      console.log('[/farcast/map-basic/callback] mint $MAP: ', (tx as ContractTransaction).hash)
    }).catch(ex => {
      console.error('[/farcast/map-basic/callback] error', ex)
    })
  }
  // TODO: return a status-checking frame instead, let user click a refresh button to see if mint is successful

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
  const html = renderImageResponse(image, 'You earned $MAP! Checkout our site', 'link', `${req.protocol}://${host}`)
  res.send(html).end()
})

if (config.debug) {
  router.get('/map-basic/callback', getPageSetting, async (req, res) => {
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
router.get('/map-basic/image', async (req, res) => {
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
