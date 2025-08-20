import ethers, { type ContractTransaction } from 'ethers'
import type { DCReward } from '../../contract/typechain-types'
import config from '../config.ts'
import DCRewardAbi from '../../contract/abi/DCReward.json' with { type: 'json' }
import PQueue from 'p-queue'
import assert from 'node:assert'
const provider = new ethers.providers.StaticJsonRpcProvider({ url: config.provider, timeout: 3500 })
assert(config.farcast.minterKey, 'minter key is empty')
const signer = new ethers.Wallet(config.farcast.minterKey, provider)
const dcReward = (new ethers.Contract(config.dcRewardContract, DCRewardAbi, provider) as DCReward).connect(signer)

export enum DCRewardTokenId {
  UNKNOWN = '0',
  MAP = '1',
  COUNTRY = '2',
  B = '3',
  AI = '4'
}
export const mint = async (
  user: string,
  tokenId: DCRewardTokenId,
  amount: number = 1,
  data: string = '0x'
): Promise<ContractTransaction> => {
  console.log(`[mint] Minting to ${user} for tokenId ${tokenId}, amount=${amount}, data=${data}`)
  return await dcReward.mint(user, tokenId, amount, data)
}

export const getBalance = async (user: string, tokenId: DCRewardTokenId): Promise<number> => {
  // console.log({ dcReward: dcReward.address, user })
  const b = await dcReward.balanceOf(user, tokenId)
  return b.toNumber()
}

export const safeGetBalance = async (user: string, tokenId: DCRewardTokenId): Promise<number> => {
  try {
    return await getBalance(user, tokenId)
  } catch (ex) {
    console.error('[safeGetBalance]', ex)
    return -1
  }
}

export const queue = new PQueue({ concurrency: 1 })
