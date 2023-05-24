import React, { useEffect, useState } from 'react'
import { FlexColumn, Main, Row } from './components/Layout'
import { BaseText, Desc, DescLeft, SmallText, Title } from './components/Text'
import config from '../config'
import { Button, Input, LinkWrarpper } from './components/Controls'
import { apis, buildClient, EWSTypes } from './api'
import { getSld, getSubdomain } from './utils'
import { isValidNotionPageId } from '../../common/notion-utils'
import { Feedback, Loading } from './components/Misc'
import useDebounce from './hooks/useDebounce'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { useTryCatch } from './hooks/useTryCatch'
import { ethers } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider'
import { type ExternalProvider } from '@ethersproject/providers'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import './manage.scss'
const Container = styled(Main)`
  margin: 0 auto;
  padding: 0 16px;
  max-width: 800px;
  // TODO: responsive
`

interface SuccessWithExplorerLinkParameters {
  message: string
  txHash: string
}

const SuccessWithExplorerLink = ({ message, txHash }: SuccessWithExplorerLinkParameters): JSX.Element => {
  return <FlexColumn style={{ gap: 8 }}>
    <BaseText>{message}</BaseText>
    <LinkWrarpper target='_blank' href={config.explorer(txHash)}>
      <BaseText>View transaction</BaseText>
    </LinkWrarpper>
  </FlexColumn>
}

const SmallTextGrey = styled(SmallText)`
  color: grey;
`

const SmallTextRed = styled(SmallText)`
  color: indianred;
`

const SmallTextGreen = styled(SmallText)`
  color: limegreen;
`

const InputBox = styled(Input)`
  border-bottom: none;
  font-size: 16px;
  margin: 0;
  background: #e0e0e0;
  &:hover{
    border-bottom: none;
  }
`

const LabelText = styled(BaseText)`
  white-space: nowrap;
`

interface SuggestedPageIdConfig {
  id: string | undefined | null | Error
  applyId?: (string) => void
}
const SuggestedPageId = ({ id, applyId }: SuggestedPageIdConfig): JSX.Element => {
  if (id === undefined) {
    return <></>
  }
  if (id === null) {
    return <SmallTextRed>Failed to extract notion page id. Please check the url.</SmallTextRed>
  }
  if (Object.prototype.toString.call(id) === '[object Error]') {
    return <SmallTextRed>Unable to parse the url to extract notion page id. Error: {id.toString()} </SmallTextRed>
  }
  return <SmallTextGrey>Extracted notion page id from url: <span style={{ color: 'black', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { applyId?.(id) }}>{id.toString()}</span></SmallTextGrey>
}

const Manage = (): JSX.Element => {
  const [address, setAddress] = useState('')
  const [provider, setProvider] = useState<any>()
  const [signer, setSigner] = useState<any>()
  const [client, setClient] = useState(buildClient())
  const [pageId, setPageId] = useState<string>('')
  const [depth, setDepth] = useState<number>(0)
  const [editingPageId, setEditingPageId] = useState<string>('')
  const [editingPageIdPosition, setEditingPagePosition] = useState<number>(0)
  const debouncedEditingPageId = useDebounce(editingPageId, 250)
  const [owner, setOwner] = useState<string>('')
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])
  const [allowMaintainerAccess, setAllowMaintainerAccess] = useState<boolean>(true)
  const [isMaintainer, setIsMaintainer] = useState<boolean>(true)
  const [suggestedPageId, setSuggestedPageId] = useState<string | undefined | null | Error>()
  const [baseFees, setBaseFees] = useState(ethers.BigNumber.from(0))
  const [perPageFees, setPerPageFees] = useState(ethers.BigNumber.from(0))
  const [perSubdomainFees, setPerSubdomainFees] = useState(ethers.BigNumber.from(0))
  const { pending, initializing, tryCatch } = useTryCatch()
  const sld = getSld()
  const subdomain = getSubdomain()
  const totalFees = baseFees.add(perPageFees.mul(allowedPageIds.length)).add(perSubdomainFees)

  const wcConnect = async (): Promise<void> => {
    try {
      const options = {
        projectId: config.walletConnectId, // REQUIRED your projectId
        chains: [Number(config.chainParameters.chainId)], // REQUIRED chain ids
        showQrModal: true, // REQUIRED set to "true" to use @web3modal/standalone,
        rpcMap: { [Number(config.chainParameters.chainId)]: config.defaultRpc } // OPTIONAL rpc urls for each chain
      }
      // console.log(options)
      const provider = await EthereumProvider.init(options)
      const [address] = await provider.enable()
      setAddress(address)
      const ethersProvider = new ethers.providers.Web3Provider(provider as ExternalProvider)
      const signer = ethersProvider.getSigner()
      setProvider(ethersProvider)
      setSigner(signer)
    } catch (ex: any) {
      console.error(ex)
      toast.error(`Failed to connect with WalletConnect: ${ex.toString()}`)
    }
  }

  async function init (): Promise<void> {
    const provider = await detectEthereumProvider()
    const ethersProvider = new ethers.providers.Web3Provider(provider as ExternalProvider)
    const signer = ethersProvider.getSigner()
    setProvider(ethersProvider)
    setSigner(signer)
  }
  const switchChain = async (address, silence): Promise<void> => {
    return window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: config.chainParameters.chainId }]
    }).then(() => {
      !silence && toast.success(`Switched to network: ${config.chainParameters.chainName}`)
      setClient(buildClient(provider, signer))
    })
  }

  const connect = async (silence): Promise<void> => {
    if (!window.ethereum) {
      !silence && toast.error('Wallet not found')
      return
    }
    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAddress(address)

      try {
        await switchChain(address, silence)
      } catch (ex: any & { code: number }) {
        console.error(ex)
        if (ex.code !== 4902) {
          !silence && toast.error(`Failed to switch to network ${config.chainParameters.chainName}: ${ex.message}`)
          return
        }
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config.chainParameters]
          })
          !silence && toast.success(`Added ${config.chainParameters.chainName} Network on MetaMask`)
        } catch (ex2) {
          // message.error('Failed to add Harmony network:' + ex.toString())
          !silence && toast.error(`Failed to add network ${config.chainParameters.chainName}: ${ex.message}`)
        }
      }

      window.ethereum.on('accountsChanged', accounts => { setAddress(accounts[0]) })
      window.ethereum.on('networkChanged', networkId => {
        console.log('networkChanged', networkId)
        init().catch(ex => { console.error(ex) })
      })
    } catch (ex) {
      console.error(ex)
    }
  }

  useEffect(() => {
    init().catch(ex => { console.error(ex) })
  }, [])

  useEffect(() => {
    if (!provider || !signer) {
      return
    }
    const c = buildClient(provider, signer)
    setClient(c)
    // @ts-expect-error debugging
    window.client = c
  }, [provider, signer])

  useEffect(() => {
    if (!client) {
      return
    }
    client.hasMaintainerRole(address).then(e => { setIsMaintainer(e) }).catch(console.error)
  }, [address, client])

  useEffect(() => {
    if (!debouncedEditingPageId) {
      return
    }
    const [parsedId] = debouncedEditingPageId.split(':')
    if (isValidNotionPageId(parsedId)) {
      setSuggestedPageId(undefined)
      return
    }
    apis.parseNotionPageIdFromRawUrl(parsedId)
      .then((id) => { setSuggestedPageId(id) })
      .catch(ex => {
        setSuggestedPageId(ex)
        console.error(ex)
      })
  }, [debouncedEditingPageId])

  const save = async (): Promise<void> => {
    const [parsedId] = debouncedEditingPageId.split(':')
    if (!isValidNotionPageId(parsedId) && pageId !== '') {
      toast.error(`Invalid landing page id: ${pageId}`)
      return
    }
    for (const id of allowedPageIds) {
      if (!isValidNotionPageId(id)) {
        toast.error(`Invalid additional page id: ${id}`)
        return
      }
    }
    tryCatch(async () => {
      const tx = await client.update(sld, subdomain, EWSTypes.EWS_NOTION, pageId, allowedPageIds, false)
      toast.success(SuccessWithExplorerLink({
        txHash: tx.hash,
        message: 'Update complete!'
      }))
    }).catch(e => { console.error(e) })
  }

  const collect = async (): Promise<void> => {
    tryCatch(async () => {
      const ids = await apis.getSameSitePageIds(pageId, depth)
      setAllowedPageIds(ids)
    }).catch(e => { console.error(e) })
  }

  useEffect(() => {
    if (!client || !sld) {
      return
    }
    tryCatch(async () => {
      return await Promise.all([
        client.getLandingPage(sld, subdomain).then(e => { setPageId(e) }),
        client.getAllowedPages(sld, subdomain).then(e => { setAllowedPageIds(e) }),
        client.getAllowMaintainerAccess(sld).then(e => { setAllowMaintainerAccess(e) }),
        client.getBaseFees().then(e => { setBaseFees(e) }),
        client.getPerPageFees().then(e => { setPerPageFees(e) }),
        client.getPerSubdomainFees().then(e => { setPerSubdomainFees(e) }),
        client.getOwner(sld).then(e => { setOwner(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, subdomain, sld, tryCatch])

  // useEffect(() => {
  //   if (!isConnected || !chain || !switchNetwork) {
  //     return
  //   }
  //   if (chain.id !== config.chainId) {
  //     console.log(config.chainId)
  //     switchNetwork(config.chainId)
  //   }
  // }, [isConnected, chain, switchNetwork])

  const allowAccess = (): boolean => {
    if (owner?.toLowerCase() === address?.toLowerCase()) {
      return true
    }
    if (allowMaintainerAccess && isMaintainer) {
      return true
    }
    return false
  }

  return (
    <Container>
      <FlexColumn style={{ alignItems: 'center', marginTop: 120, gap: 16 }}>
        <Title style={{ margin: 0 }}>{subdomain}{subdomain ? '.' : ''}{sld}.{config.tld}</Title>
        <SmallTextGrey>Connect your .country with notion pages</SmallTextGrey>
        {owner && <SmallTextGrey>Owner: {owner}</SmallTextGrey>}
      </FlexColumn>
      <Desc>
        <Button onClick={connect} style={{ width: 'auto' }}> CONNECT METAMASK</Button>
        <Button onClick={wcConnect} style={{ width: 'auto' }}> CONNECT WALLET CONNECT</Button>
        {address && <SmallTextGrey style={{ wordBreak: 'break-word', userSelect: 'all' }}>connected: {address}</SmallTextGrey>}
      </Desc>
      {address && (allowAccess()) &&
        <DescLeft>
          <Row>
            <LabelText>Main page id</LabelText>
            <InputBox $width={'100%'} value={pageId} placeholder={'ae42787a7d...'} onChange={({ target: { value } }) => { setPageId(value); setEditingPageId(value); setEditingPagePosition(0) }}/>
          </Row>
          {(editingPageIdPosition === 0) && <SuggestedPageId id={suggestedPageId} applyId={setPageId}/>}
          <SmallTextGrey>This is the landing page when people visit {subdomain}{subdomain ? '.' : ''}{sld}.{config.tld} </SmallTextGrey>
          <LabelText style={{ marginTop: 32 }}>Additional pages</LabelText>
          <SmallTextGrey>You allow the following subpages on web.{sld}.{config.tld}. Links to these pages will be rewritten under web.{sld}.{config.tld}, instead of to external sites (e.g. https://notion.so/....)</SmallTextGrey>
          <Row>
            <Button onClick={collect} disabled={initializing || pending} style={{ whiteSpace: 'nowrap', width: 'fit-content' }}>COLLECT AUTOMATICALLY</Button>
            <BaseText>DEPTH</BaseText>
            <Button
                style={{ whiteSpace: 'nowrap', width: 'fit-content' }}
                onClick={() => { setDepth(d => Math.max(0, d - 1)) } } disabled={initializing || pending}>-</Button>
            <BaseText>{depth}</BaseText>
            <Button
                style={{ whiteSpace: 'nowrap', width: 'fit-content' }}
                onClick={() => { setDepth(d => Math.min(2, d + 1)) } } disabled={initializing || pending}>+</Button>
          </Row>
          {allowedPageIds.map((pid, i) => {
            return <React.Fragment key={`${i}-${pid}`}>
              <Row>
                <InputBox $width={'100%'} value={pid} onChange={({ target: { value } }) => { setAllowedPageIds(e => [...e.slice(0, i), value, ...e.slice(i + 1)]); setEditingPageId(value); setEditingPagePosition(i + 1) }}/>
                <Button disabled={initializing || pending} $width={'auto'} onClick={ () => { setAllowedPageIds(e => [...e.slice(0, i), ...e.slice(i + 1)]); setEditingPageId(''); setEditingPagePosition(0) }}>
                  {pending ? <Loading/> : 'REMOVE' }
                </Button>
              </Row>
              {(i === editingPageIdPosition - 1) && <SuggestedPageId id={suggestedPageId} applyId={id => { setAllowedPageIds(e => [...e.slice(0, i), id, ...e.slice(i + 1)]) }} />}
            </React.Fragment>
          })}
          <Row style={{ marginTop: 32, justifyContent: 'space-between' }}>
            <Button disabled={initializing || pending} $width={'auto'} onClick={ () => { setAllowedPageIds(e => [...e, '']) }}>{'ADD MORE'}</Button>
            <Button disabled={initializing || pending} $width={'auto'} onClick={ save}>{pending ? <Loading/> : 'SAVE ALL' }</Button>
          </Row>
          {totalFees.gt(0)
            ? <Row style={{ marginTop: 32 }}>
              <BaseText>Total fees: {ethers.utils.formatEther(totalFees)} ONE (base fees {ethers.utils.formatEther(baseFees)} ONE, plus per {ethers.utils.formatEther(perPageFees)} page, plus {ethers.utils.formatEther(perSubdomainFees)} per subdomain)</BaseText>
            </Row>
            : <></>}
        </DescLeft>
      }

      <div style={{ height: 320 }}/>
      <Feedback/>
    </Container>)
}

export default Manage
