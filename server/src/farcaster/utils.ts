import config from '../../config.js'
import { type DomainInfo } from '../types.js'
import { type FarcastUserInfo } from './types.ts'
import axios from 'axios'

export const getPostUrl = (sld: string, subdomain?: string): string => {
  if (!config.farcast.postUrlSubdomainPrefix) {
    return subdomain ? `${subdomain}.${sld}.${config.TLD}` : `${sld}.${config.TLD}`
  }

  if (!subdomain) {
    return `${config.farcast.postUrlSubdomainPrefix}.${sld}.${config.TLD}`
  }
  return `${config.farcast.postUrlSubdomainPrefix}-${subdomain}.${sld}.${config.TLD}`
}

export const getDefaultTokenName = (domainInfo: DomainInfo): string => {
  if (domainInfo.farcastDefaultTokenName) {
    return domainInfo.farcastDefaultTokenName
  }
  if (domainInfo.subdomain) {
    if (domainInfo.subdomain === 'www') {
      return `$${domainInfo.sld.toUpperCase()}`
    }
    return `$${domainInfo.subdomain?.toUpperCase()}.${domainInfo.sld.toUpperCase()}`
  }
  return `$${domainInfo.sld.toUpperCase()}`
}

export const lookupFid = async (fid: number): Promise<FarcastUserInfo> => {
  const { data: { transfer } } = await axios.get(`https://fnames.farcaster.xyz/transfers/current?fid=${fid}`)
  const { owner, username, timestamp }: { owner: string, username: string, timestamp: number } = transfer
  // console.log({ fid, owner, username, timestamp: timestamp * 1000 })
  return { fid, owner, username, timestamp: timestamp * 1000 }
}

// export const getHost = (domainInfo: DomainInfo): string => {
//   if (domainInfo.subdomain) {
//     return `${domainInfo.subdomain}.${domainInfo.sld}.${config.TLD}`
//   }
//   return `${domainInfo.sld}.${config.TLD}`
// }
