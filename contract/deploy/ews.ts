import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ethers } from 'hardhat'
import { EWS } from '../typechain-types'

const DC_CONTRACT = process.env.DC_CONTRACT
const LANDING_PAGE_FEE = process.env.LANDING_PAGE_FEE || '0'
const PER_PAGE_FEE = process.env.PER_PAGE_FEE || '0'
const MAINTAINERS = JSON.parse(process.env.MAINTAINERS || '[]') as string[]

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
  const maintainerRole = await ews.MAINTAINER_ROLE()
  for (const m of MAINTAINERS) {
    const tx = await ews.grantRole(maintainerRole, m)
    await tx.wait()
    console.log(`Granted maintainer to ${m} (tx: ${tx.hash})`)
  }
  console.log('EWS deployed at:', ews.address)
  console.log('- Deployer Admin Role:', await ews.hasRole(await ews.DEFAULT_ADMIN_ROLE(), deployer))
  console.log('- Deployer Maintainer Role:', await ews.hasRole(maintainerRole, deployer))
  console.log('- DC:', await ews.dc())
  console.log('- landingPageFee:', (await ews.landingPageFee()).toString())
  console.log('- perAdditionalPageFee:', (await ews.perAdditionalPageFee()).toString())
}
f.tags = ['EWS']
export default f
