import axios from 'axios'
import config from '../../config.js'
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs'
import { LRUCache } from 'lru-cache'

export const base = axios.create({ timeout: 5000 })

export const client = config.farcast.hubUrl ? getSSLHubRpcClient(config.farcast.hubUrl) : undefined
export const getOriginalHost = (s: string): string => {
  s = s.substring(config.farcast.postUrlSubdomainPrefix.length)
  if (s.startsWith('-')) {
    s = s.slice(1)
  }
  return s
}

export const tokenCache = new LRUCache<string, string>({
  max: 5000,
  maxSize: 50000,
  sizeCalculation: (value, key) => {
    return 1
  },
  ttl: 1000 * 60
})
