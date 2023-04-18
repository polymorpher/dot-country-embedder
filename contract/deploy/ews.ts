import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'
import { EWS } from '../typechain-types'

const DC_CONTRACT = process.env.DC_CONTRACT
const LANDING_PAGE_FEE = process.env.LANDING_PAGE_FEE || '0'
const PER_PAGE_FEE = process.env.PER_PAGE_FEE || '0'

const f = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments: { deploy }, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()
  const ewsDeploy = await deploy('EWS', {
    from: deployer,
    args: [
      DC_CONTRACT,
      ethers.utils.parseEther(LANDING_PAGE_FEE),
      ethers.utils.parseEther(PER_PAGE_FEE)
    ]
  })
  const ews: EWS = await ethers.getContractAt('EWS', ewsDeploy.address)
  console.log('EWS deployed at:', ews.address)
  console.log('- EWS Owner:', await ews.owner())
  console.log('- DC:', await ews.dc())
  console.log('- landingPageFee:', (await ews.landingPageFee()).toString())
  console.log('- perAdditionalPageFee:', (await ews.perAdditionalPageFee()).toString())
}
f.tags = ['EWS']
export default f
