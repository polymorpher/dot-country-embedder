import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'
import { DCReward } from '../typechain-types'
import assert from 'node:assert'

const f = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()

  if (!process.env.DC_REWARD_ADMIN) {
    console.log(`[WARNING] using deployer ${deployer} as DC_REWARD_ADMIN`)
  }
  if (!process.env.DC_REWARD_URI_SETTER) {
    console.log(`[WARNING] using deployer ${deployer} as DC_REWARD_URI_SETTER`)
  }
  const DC_REWARD_ADMIN = process.env.DC_REWARD_ADMIN ?? deployer
  const DC_REWARD_URI_SETTER = process.env.DC_REWARD_URI_SETTER ?? deployer
  const DC_REWARD_MINTER = process.env.DC_REWARD_MINTER
  const DC_REWARD_PAUSER = process.env.DC_REWARD_PAUSER
  const BASE_URI = process.env.DC_REWARD_BASE_URI
  const CONTRACT_URI = process.env.DC_REWARD_CONTRACT_URI

  assert(DC_REWARD_ADMIN, 'DC_REWARD_ADMIN is empty')
  assert(DC_REWARD_URI_SETTER, 'DC_REWARD_URI_SETTER is empty')
  assert(DC_REWARD_MINTER, 'DC_REWARD_MINTER is empty')
  assert(DC_REWARD_PAUSER, 'DC_REWARD_PAUSER is empty')
  assert(CONTRACT_URI, 'CONTRACT_URI is empty')
  assert(BASE_URI, 'BASE_URI is empty')

  const dcRewardDeploy = await deploy('DCReward', {
    from: deployer,
    args: [
      DC_REWARD_ADMIN,
      DC_REWARD_URI_SETTER,
      DC_REWARD_PAUSER,
      DC_REWARD_MINTER,
      BASE_URI
    ]
  })
  const dcr: DCReward = await ethers.getContractAt('DCReward', dcRewardDeploy.address)
  console.log(`DCReward deployed at ${dcr.address}`)
  const tx = await dcr.setContractURI(CONTRACT_URI)
  await tx.wait()
  console.log(`DCReward contract URI set at ${CONTRACT_URI} | tx=${tx.hash}`)

  console.log('DCReward deployed at:', dcr.address)
  console.log(`- Deployer (${deployer}) Admin Role:`, await dcr.hasRole(await dcr.DEFAULT_ADMIN_ROLE(), deployer))
  console.log(`- DC_REWARD_ADMIN (${DC_REWARD_ADMIN}) Admin Role:`, await dcr.hasRole(await dcr.DEFAULT_ADMIN_ROLE(), DC_REWARD_ADMIN))
  console.log(`- DC_REWARD_URI_SETTER (${DC_REWARD_URI_SETTER}) Admin Role:`, await dcr.hasRole(await dcr.URI_SETTER_ROLE(), DC_REWARD_URI_SETTER))
  console.log(`- DC_REWARD_MINTER (${DC_REWARD_ADMIN}) Minter Role:`, await dcr.hasRole(await dcr.MINTER_ROLE(), DC_REWARD_MINTER))
  console.log(`- DC_REWARD_PAUSER (${DC_REWARD_ADMIN}) Pauser Role:`, await dcr.hasRole(await dcr.PAUSER_ROLE(), DC_REWARD_PAUSER))
  console.log('- CONTRACT_URI:', (await dcr.contractURI()).toString())
  console.log('- uri(0):', (await dcr.uri(0)).toString())
}
f.tags = ['DCReward']
export default f
