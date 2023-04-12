import config from '../config'
// import { type ContractTransaction, ethers } from 'ethers'
import axios from 'axios'
import { type ExtendedRecordMap } from 'notion-types'

const base = axios.create({ baseURL: config.server, timeout: 10000 })

// interface APIResponse {
//   success?: boolean
//   error?: string
// }
export const apis = {
  getNotionPage: async (id: string): Promise<ExtendedRecordMap> => {
    const { data } = await base.get('/notion', { params: { id } })
    return data
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Client {
  // TODO
}
export const buildClient = (provider?, signer?): Client => {
  // const etherProvider = provider ?? new ethers.providers.StaticJsonRpcProvider(config.defaultRpc)

  return {}
}
