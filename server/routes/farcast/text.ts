import { DCRewardTokenId, mint, queue } from '../../src/dc-reward.js'
import { type ContractTransaction } from 'ethers'
import { HttpStatusCode } from 'axios'
import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import { lookupFid, renderMintFailed, renderImageResponse, parseTextToSvg } from '../../src/farcaster.js'

router.post('/text/callback', authMessage, getPageSetting, async (req, res) => {
  const host = req.get('host')
  // console.log('[/farcast/callback] validatedMessage', validatedMessage)
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`
  if (!req.validatedMessage) {
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const input = req.validatedMessage.data?.frameActionBody?.inputText
  if (!input) {
    console.error('[/text/callback] Validated data has no user input')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  const text = new TextDecoder().decode(input)
  const image = `${req.protocol}://${host}/${config.farcast.apiBase}/text/image?t=${encodeURIComponent(text)}`
  // console.log('image', image)
  const fid = req.validatedMessage.data?.fid
  if (!fid) {
    console.error('[/farcast/text/callback] No fid found in validatedMessage')
    return res.send(renderMintFailed(restartTarget)).end()
  }
  if (!config.farcast.mockMinting) {
    const { owner } = await lookupFid(fid)
    queue.add(async () => await mint(owner, DCRewardTokenId.COUNTRY)).then((tx) => {
      console.log('[/farcast/text/callback] mint $COUNTRY: ', (tx as ContractTransaction).hash)
    }).catch(ex => {
      console.error('[/farcast/text/callback] error', ex)
    })
  }
  // TODO: return a status-checking frame instead, let user click a refresh button to see if mint is successful

  const html = renderImageResponse(image, `You earned $COUNTRY! Checkout ${host}`, 'link', `${req.protocol}://${host}`)
  res.send(html).end()
})

if (config.debug) {
  router.get('/text/callback', async (req, res) => {
    const host = req.get('host')
    const text = (req.query.t ?? '') as string
    const image = `${req.protocol}://${host}/${config.farcast.apiBase}/text/image?t=${encodeURIComponent(text)}`
    // TODO: actually mint the token for lottery
    const html = renderImageResponse(image, `You earned $COUNTRY! Checkout ${host}`, 'link', `${req.protocol}://${host}`)
    res.send(html).end()
  })
}

router.get('/text/image', async (req, res) => {
  const text = (req.query.t ?? '') as string
  const style = JSON.parse((req.query.s ?? '{}') as string)
  if (!text) {
    return res.status(HttpStatusCode.BadRequest).send('No text provided').end()
  }
  const data = parseTextToSvg(text, style)
  res.type('svg')
  // res.header('Cache-Control', 'public, max-age=0, must-revalidate')
  res.send(data).end()
})
