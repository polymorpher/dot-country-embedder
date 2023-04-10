import config from '../config'
// import { type ContractTransaction, ethers } from 'ethers'
import axios from 'axios'

// const base = axios.create({ baseURL: config.easServer, timeout: 10000 })

// interface APIResponse {
//   success?: boolean
//   error?: string
// }
export const apis = {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Client {
  // TODO
}
export const buildClient = (provider?, signer?): Client => {
  // const etherProvider = provider ?? new ethers.providers.StaticJsonRpcProvider(config.defaultRpc)

  return {}
}
