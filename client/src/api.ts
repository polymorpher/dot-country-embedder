import config from '../config'
import EWSAbi from '../../contract/abi/EWS.json'
import IDCAbi from '../../contract/abi/IDC.json'
import { type BigNumber, type ContractTransaction, ethers } from 'ethers'
import axios from 'axios'
import { type ExtendedRecordMap } from 'notion-types'
import { type EWS, type IDC } from '../../contract/typechain-types'
import { isValidNotionPageId } from '../../common/notion-utils'
const base = axios.create({ baseURL: config.server, timeout: 10000 })
const substackBase = axios.create({ baseURL: config.substackServer, timeout: 10000 })

// interface APIResponse {
//   success?: boolean
//   error?: string
// }
export const apis = {
  getNotionPage: async (id: string): Promise<ExtendedRecordMap> => {
    const { data } = await base.get('/notion', { params: { id } })
    return data
  },
  getSameSitePageIds: async (id: string, depth = 0): Promise<string[]> => {
    const { data } = await base.get('/links', { params: { id, depth } })
    return data
  },
  parseNotionPageIdFromRawUrl: async (url: string): Promise<string | null> => {
    const urlObject = new URL(url)
    const path = urlObject.pathname
    const parts = path.split('-')
    const tentativePageId = parts[parts.length - 1]
    if (isValidNotionPageId(tentativePageId)) {
      return tentativePageId
    }
    console.log(`Cannot extract page id from ${url}. Downloading content...`)
    const { data } = await base.post('/parse', { url })
    const { id, error }: { id: string, error: string } = data
    if (error) {
      throw new Error(error)
    }
    if (!id) {
      return null
    }
    return id
  },
  getSubstackPage: async (url: string) => {
    const { data } = await substackBase.get('/substack', { params: { url } })
    return data
  }
}

type EWSType = 0 | 1 | 2

export const EWSTypes: Record<string, EWSType> = {
  EWS_UNKNOWN: 0,
  EWS_NOTION: 1,
  EWS_SUBSTACK: 2
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Client {
  ews: EWS
  dc: () => Promise<IDC>
  hasMaintainerRole: (address: string) => Promise<boolean>
  getOwner: (sld: string) => Promise<string>
  getAllowMaintainerAccess: (sld: string) => Promise<boolean>
  getExpirationTime: (sld: string) => Promise<number>
  getBaseFees: () => Promise<BigNumber>
  getPerPageFees: () => Promise<BigNumber>
  getPerSubdomainFees: () => Promise<BigNumber>
  getLandingPage: (sld: string, subdomain: string) => Promise<string>
  getAllowedPages: (sld: string, subdomain: string) => Promise<string[]>
  getEwsType: (sld: string, subdomain: string) => Promise<number>
  canRestore: (sld: string, subdomain: string) => Promise<boolean>
  update: (sld: string, subdomain: string, ewsType: EWSType, page: string, pages: string[], landingPageOnly: boolean) => Promise<ContractTransaction>
  appendAllowedPages: (sld: string, subdomain: string, pages: string[]) => Promise<ContractTransaction>
  remove: (sld: string, subdomain: string) => Promise<ContractTransaction>
  restore: (sld: string, subdomain: string, ewsType: EWSType) => Promise<ContractTransaction>
}
export const buildClient = (provider?, signer?, failover = false): Client => {
  const etherProvider = provider ?? new ethers.providers.StaticJsonRpcProvider(config.defaultRpc)
  let ews = new ethers.Contract(config.embedderContract, EWSAbi, etherProvider) as EWS
  let _dc: IDC
  const dc = async (): Promise<IDC> => {
    if (_dc) {
      return _dc
    }
    const dcAddress = await ews.dc()
    _dc = new ethers.Contract(dcAddress, IDCAbi, etherProvider) as IDC
    if (signer) {
      _dc = _dc.connect(signer)
    }
    return _dc
  }
  dc().catch(e => { console.error(e) })
  if (signer) {
    ews = ews.connect(signer)
  }
  return {
    ews,
    dc,
    getOwner: async (sld: string) => {
      const c = await dc()
      return await c.ownerOf(sld)
    },
    getExpirationTime: async (sld: string) => {
      const c = await dc()
      const r = await c.nameExpires(sld)
      return r.toNumber() * 1000
    },
    getBaseFees: async (): Promise<BigNumber> => {
      return await ews.landingPageFee()
    },
    getPerPageFees: async (): Promise<BigNumber> => {
      return await ews.perAdditionalPageFee()
    },
    getPerSubdomainFees: async (): Promise<BigNumber> => {
      return await ews.perSubdomainFee()
    },
    getLandingPage: async (sld: string, subdomain: string): Promise<string> => {
      const l = await ews.getLandingPage(ethers.utils.id(sld), ethers.utils.id(subdomain))
      if (!l && failover) {
        const upgradedFrom = await ews.upgradedFrom()
        if (!upgradedFrom) {
          return l
        }
        const c = new ethers.Contract(upgradedFrom, EWSAbi, etherProvider) as EWS
        return await c.getLandingPage(ethers.utils.id(sld), ethers.utils.id(subdomain))
      }
      return l
    },
    getEwsType: async (sld: string, subdomain: string): Promise<number> => {
      return await ews.getEwsType(ethers.utils.id(sld), ethers.utils.id(subdomain))
    },
    getAllowedPages: async (sld: string, subdomain: string): Promise<string[]> => {
      const pages = await ews.getAllowedPages(ethers.utils.id(sld), ethers.utils.id(subdomain))
      if (pages.length === 0 && failover) {
        const upgradedFrom = await ews.upgradedFrom()
        if (!upgradedFrom) {
          return []
        }
        const c = new ethers.Contract(upgradedFrom, EWSAbi, etherProvider) as EWS
        return await c.getAllowedPages(ethers.utils.id(sld), ethers.utils.id(subdomain))
      }
      return pages
    },
    getAllowMaintainerAccess: async (sld: string): Promise<boolean> => {
      return await ews.getAllowMaintainerAccess(ethers.utils.id(sld))
    },
    update: async (sld: string, subdomain: string, ewsType: EWSType, page: string, pages: string[], landingPageOnly: boolean): Promise<ContractTransaction> => {
      const fees = await ews.getFees(sld, subdomain, landingPageOnly ? 0 : pages.length)
      return await ews.update(sld, subdomain, ewsType, page, pages, landingPageOnly, { value: fees })
    },
    appendAllowedPages: async (sld: string, subdomain: string, pages: string[]): Promise<ContractTransaction> => {
      const additionalFees = await ews.perAdditionalPageFee()
      return await ews.appendAllowedPages(sld, subdomain, pages, { value: additionalFees.mul(pages.length) })
    },
    remove: async (sld: string, subdomain: string): Promise<ContractTransaction> => {
      return await ews.remove(sld, subdomain)
    },
    restore: async (sld: string, subdomain: string, ewsType: EWSType): Promise<ContractTransaction> => {
      return ews.restore(sld, subdomain, ewsType)
    },
    canRestore: async (sld: string, subdomain: string): Promise<boolean> => {
      const currentLandingPage = await ews.getLandingPage(ethers.utils.id(sld), ethers.utils.id(subdomain))
      if (currentLandingPage) {
        return false
      }
      const upgradedFrom = await ews.upgradedFrom()
      if (!upgradedFrom || upgradedFrom === ethers.constants.AddressZero) {
        return false
      }
      const c = new ethers.Contract(upgradedFrom, EWSAbi, etherProvider) as EWS
      const landingPage = await c.getLandingPage(ethers.utils.id(sld), ethers.utils.id(subdomain))
      return !!landingPage
    },
    hasMaintainerRole: async (address: string): Promise<boolean> => {
      if (!address) {
        return false
      }
      return await ews.hasRole(await ews.MAINTAINER_ROLE(), address)
    }
  }
}
