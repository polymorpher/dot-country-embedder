import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import { lookupFid, renderMintFailed, renderMintSuccess } from '../../src/farcaster.js'
import { getOriginalHost } from './utils.js'

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { owner } = await lookupFid(fid)
  // TODO: implement minting custom token - need a registration process first

  // res.send(renderMintFailed(`${req.protocol}://${host}/${config.farcast.postUrlPath}/redirect`)).end()
  res.send(renderMintSuccess()).end()
  // respond a new frame
})

router.post('/callback/redirect', async (req, res) => {
  console.log('[/farcast/callback/redirect] body', JSON.stringify(req.body))
  const host = getOriginalHost(req.get('host') ?? '')
  const target = `https://${host}/`
  console.log(`[/farcast/callback/redirect] Redirecting to ${target}`)
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
