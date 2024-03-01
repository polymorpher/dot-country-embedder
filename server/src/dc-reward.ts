import ethers, { type ContractTransaction } from 'ethers'
import type { DCReward } from '../../contract/typechain-types'
import config from '../config.ts'
import DCRewardAbi from '../../contract/abi/DCReward.json' assert {type: 'json'}
import PQueue from 'p-queue'
const provider = new ethers.providers.StaticJsonRpcProvider(config.provider)
const dcReward = new ethers.Contract(config.dcRewardContract, DCRewardAbi, provider) as unknown as DCReward
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
  return await dcReward.mint(user, tokenId, amount, data)
}

export const getBalance = async (user: string, tokenId: DCRewardTokenId): Promise<number> => {
  const b = await dcReward.balanceOf(user, tokenId)
  return b.toNumber()
}

export const queue = new PQueue({ concurrency: 1 })
