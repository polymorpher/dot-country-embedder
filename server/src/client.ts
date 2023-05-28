import config from '../config.ts'
import EWSAbi from '../../contract/abi/EWS.json' assert {
  type: 'json'
}
import { ethers } from 'ethers'
import { type EWS } from '../../contract/typechain-types'

export interface Client {
  getLandingPage: (sld: string, subdomain: string) => Promise<string>
}

export const buildClient = (provider?): Client => {
  const etherProvider = provider ?? new ethers.providers.StaticJsonRpcProvider(config.provider)
  const ews = new ethers.Contract(config.ewsContract, EWSAbi, etherProvider) as EWS

  return {
    getLandingPage: async (sld: string, subdomain: string): Promise<string> => {
      return await ews.getLandingPage(ethers.utils.id(sld), ethers.utils.id(subdomain))
    }
  }
}
