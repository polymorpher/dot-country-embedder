import { type NextFunction, type Request, type Response } from 'express'
import config from '../../config.js'
import { HttpStatusCode } from 'axios'
import { client, getOriginalHost } from './utils.ts'
import { Message } from '@farcaster/hub-nodejs'
import { parsePageSetting } from '../../src/util.ts'

export const authMessage = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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

export const getPageSetting = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    req.domainInfo = await parsePageSetting(req.hostname)
    next()
  } catch (ex: any) {
    console.error('[getPageSetting] ', ex)
    res.status(HttpStatusCode.InternalServerError).send('Cannot retrieve domain info based on hostname').end()
  }
}
