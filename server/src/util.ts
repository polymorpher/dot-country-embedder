import { type AxiosError } from 'axios'
import { getSld, getSubdomain, parseSettings } from '../../common/domain-utils.ts'
import ethers from 'ethers'
import config from '../config.ts'
import EWSAbi from '../../contract/abi/EWS.json' assert {type: 'json'}
import { type EWS } from '../../contract/typechain-types'
import { type DomainInfo } from './types.ts'

export function printError (ex: any): void {
  if (ex?.response) {
    const e = ex as AxiosError
    let data = JSON.stringify(e.response?.data)
    if (data.length > 200) {
      data = data.slice(0, 200) + '...'
    }
    console.error(e.response?.status, e.response?.statusText, e.config?.url, data)
    return
  }
  console.error(ex)
}

const provider = new ethers.providers.StaticJsonRpcProvider(config.provider)
export async function parsePageSetting (hostname: string): Promise<DomainInfo> {
  const parts = hostname.split('.')
  const subdomain = getSubdomain(parts)
  const sld = getSld(parts)
  const c = new ethers.Contract(config.ewsContract, EWSAbi, provider) as unknown as EWS
  const node = ethers.utils.id(sld)
  const label = ethers.utils.id(subdomain)
  const landingPageSetting = await c.getLandingPage(node, label)
  return settingToDomainInfo(sld, subdomain, landingPageSetting)
}

export function settingToDomainInfo (sld: string, subdomain: string, landingPageSetting: string): DomainInfo {
  const {
    landingPage,
    unrestrictedMode,
    farcastEnabled,
    farcastMintCustomToken,
    farcastDefaultTokenName,
    farcastMap
  } = parseSettings(landingPageSetting)
  return {
    sld,
    subdomain,
    landingPage,
    unrestrictedMode,
    farcastEnabled,
    farcastMintCustomToken,
    farcastDefaultTokenName,
    farcastMap
  }
}
