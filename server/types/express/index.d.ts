import { type Message } from '@farcaster/hub-nodejs'
import { type DomainInfo } from '../../src/types.ts'

declare global {
  namespace Express {
    interface Request {
      validatedMessage?: Message
      domainInfo?: DomainInfo
    }
  }
}

export {}
