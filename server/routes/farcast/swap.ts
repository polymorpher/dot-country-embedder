import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import { lookupFid, parseTextToSvg, renderImageResponse, svgToPng } from '../../src/farcaster.js'
import type { Request } from 'express'
import { HttpStatusCode } from 'axios'

const generateImageResponse = (text: string, req: Request, retry = false): string => {
  const host = req.get('host')
  const image = `${req.protocol}://${host}/${config.farcast.apiBase}/swap/image/${encodeURIComponent(text)}`
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`

  if (retry) {
    return renderImageResponse(image, 'Retry', 'post', restartTarget)
  }

  return renderImageResponse(image)
}

router.get('/swap/image/:text', async (req, res) => {
  const style = JSON.parse((req.query.s ?? '{}') as string)
  if (!req.params.text) {
    return res.status(HttpStatusCode.BadRequest).send('No text provided').end()
  }
  const data = parseTextToSvg(req.params.text, style)
  if (req.query.png) {
    res.type('png')
    const png = await svgToPng(data)
    res.send(png).end()
    return
  }
  res.type('svg')
  res.header('Cache-Control', 'public, max-age=0, must-revalidate')
  res.header('Age', '0')
  res.send(data).end()
})

router.post('/swap/buy/callback', authMessage, getPageSetting, async (req, res) => {
  if (!req.validatedMessage) {
    const html = generateImageResponse('Failed to validate the message. Please try again later.', req, true)
    return res.send(html).end()
  }

  const balanceInSat = 0
  const price = 0

  // TODO: BUY

  const fid = req.validatedMessage.data?.fid

  if (!fid) {
    console.error('[/farcast/swap/buy/callback] No fid found in validatedMessage')
    const html = generateImageResponse('Failed to get fid. Please try again later.', req, true)
    return res.send(html).end()
  }

  try {
    const { owner } = await lookupFid(fid)

    const text = `${balanceInSat} $B sats @ $${price} BTC.\n${owner}`
    const html = generateImageResponse(text, req)

    res.header('Cache-Control', 'public, max-age=0, must-revalidate')
    res.header('Age', '0')
    res.send(html).end()
  } catch {
    const html = generateImageResponse('Failed to get owner from fid. Please try again later.', req, true)
    return res.send(html).end()
  }
})

router.post('/swap/sell/callback', authMessage, getPageSetting, async (req, res) => {
  if (!req.validatedMessage) {
    const html = generateImageResponse('Failed to validate the message. Please try again later.', req, true)
    return res.send(html).end()
  }

  const balanceInSat = 0
  const price = 0

  // TODO: SELL

  const fid = req.validatedMessage.data?.fid

  if (!fid) {
    console.error('[/farcast/swap/sell/callback] No fid found in validatedMessage')
    const html = generateImageResponse('Failed to get fid. Please try again later.', req, true)
    return res.send(html).end()
  }

  try {
    const { owner } = await lookupFid(fid)

    const text = `${balanceInSat} $B sats @ $${price} BTC.\n${owner}`
    const html = generateImageResponse(text, req)

    res.header('Cache-Control', 'public, max-age=0, must-revalidate')
    res.header('Age', '0')
    res.send(html).end()
  } catch {
    const html = generateImageResponse('Failed to get owner from fid. Please try again later.', req, true)
    return res.send(html).end()
  }
})
