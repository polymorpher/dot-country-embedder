import config from '../../config.js'
import { type DomainInfo } from '../types.js'
import { type FarcastUserInfo } from './types.ts'
import axios from 'axios'
import ethers from 'ethers'
import sharp from 'sharp'
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

export const computeButtonDisplayedLocation = (location: string, farcastMapSuffix?: string): string => {
  farcastMapSuffix = farcastMapSuffix ?? config.google.map.defaultLocationSuffix
  if (farcastMapSuffix?.startsWith('??')) {
    farcastMapSuffix = farcastMapSuffix.substring(2)
  }
  if (location.endsWith(farcastMapSuffix)) {
    return location.substring(0, location.length - farcastMapSuffix.length)
  }
  return location
}

export const inscribeLocationAndReview = (location: string, review?: string): string => {
  if (!review) {
    return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`${location}`))
  }
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`${location}:::${review}`))
}

export const svgToPng = async (svg: string): Promise<Buffer> => {
  return await sharp(Buffer.from(svg)).png().toBuffer()
}
export const getHost = (domainInfo: DomainInfo): string => {
  if (domainInfo.subdomain) {
    return `${domainInfo.subdomain}.${domainInfo.sld}.${config.TLD}`
  }
  return `${domainInfo.sld}.${config.TLD}`
}
