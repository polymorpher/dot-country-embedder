import config from '../config'
import EWSAbi from '../../contract/abi/EWS.json'
import IDCAbi from '../../contract/abi/IDC.json'
import { type BigNumber, type ContractTransaction, ethers } from 'ethers'
import axios from 'axios'
import { type ExtendedRecordMap } from 'notion-types'
import { type EWS, type IDC } from '../../contract/typechain-types'
import { isValidNotionPageId } from '../../common/notion-utils'
const base = axios.create({ baseURL: config.server, timeout: 10000 })

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
  }
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
  getLandingPage: (sld: string) => Promise<string>
  getAllowedPages: (sld: string) => Promise<string[]>
  update: (sld: string, page: string, pages: string[], landingPageOnly: boolean) => Promise<ContractTransaction>
  appendAllowedPages: (sld: string, pages: string[]) => Promise<ContractTransaction>
  remove: (sld: string) => Promise<ContractTransaction>
}
export const buildClient = (provider?, signer?): Client => {
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
    getLandingPage: async (sld: string): Promise<string> => {
      return await ews.getLandingPage(ethers.utils.id(sld))
    },
    getAllowedPages: async (sld: string): Promise<string[]> => {
      return await ews.getAllowedPages(ethers.utils.id(sld))
    },
    getAllowMaintainerAccess: async (sld: string): Promise<boolean> => {
      return await ews.getAllowMaintainerAccess(ethers.utils.id(sld))
    },
    update: async (sld: string, page: string, pages: string[], landingPageOnly: boolean): Promise<ContractTransaction> => {
      const baseFees = await ews.landingPageFee()
      const additionalFees = await ews.perAdditionalPageFee()
      return await ews.update(sld, page, pages, landingPageOnly, { value: landingPageOnly ? baseFees : (baseFees.add(additionalFees.mul(pages.length))) })
    },
    appendAllowedPages: async (sld: string, pages: string[]): Promise<ContractTransaction> => {
      const additionalFees = await ews.perAdditionalPageFee()
      return await ews.appendAllowedPages(sld, pages, { value: additionalFees.mul(pages.length) })
    },
    remove: async (sld: string): Promise<ContractTransaction> => {
      return await ews.remove(sld)
    },
    hasMaintainerRole: async (address: string): Promise<boolean> => {
      return await ews.hasRole(await ews.MAINTAINER_ROLE(), address)
    }
  }
}
