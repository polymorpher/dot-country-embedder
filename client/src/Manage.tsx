import React, { useEffect, useState } from 'react'
import { FlexColumn, FlexRow, Main, Row } from './components/Layout'
import { Address, BaseText, Desc, DescLeft, SmallText, Title } from './components/Text'
import config from '../config'
import { Button, Input, LinkWrarpper } from './components/Controls'
import {useAccount, useConnect, useNetwork, useProvider, useSigner, useSwitchNetwork} from 'wagmi'
import { buildClient } from './api'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { getSld } from './utils'
import { TailSpin } from 'react-loading-icons'
import { Feedback, Loading } from './components/Misc'
import useDebounce from './hooks/useDebounce'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { useTryCatch } from './hooks/useTryCatch'
import { ethers } from 'ethers'

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

const Manage = (): JSX.Element => {
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()

  const { address, isConnected } = useAccount()
  const provider = useProvider()
  const [client, setClient] = useState(buildClient())
  const { data: signer } = useSigner()
  const { connect } = useConnect({ connector: new InjectedConnector() })
  const [pageId, setPageId] = useState<string>('')
  const [owner, setOwner] = useState<string>('')
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])
  const [baseFees, setBaseFees] = useState(ethers.BigNumber.from(0))
  const [perPageFees, setPerPageFees] = useState(ethers.BigNumber.from(0))
  const { pending, setPending, initializing, tryCatch } = useTryCatch()
  const sld = getSld()
  const totalFees = baseFees.add(perPageFees.mul(allowedPageIds.length))
  useEffect(() => {
    if (!provider || !signer) {
      return
    }
    const c = buildClient(provider, signer)
    setClient(c)
    // @ts-expect-error debugging
    window.client = c
  }, [provider, signer])

  const save = async (): Promise<void> => {
    tryCatch(async () => {
      await client.update(sld, pageId, allowedPageIds, false)
    }).catch(e => { console.error(e) })
  }

  useEffect(() => {
    if (!client || !sld) {
      return
    }
    tryCatch(async () => {
      return await Promise.all([
        client.getLandingPage(sld).then(e => { setPageId(e) }),
        client.getAllowedPages(sld).then(e => { setAllowedPageIds(e) }),
        client.getBaseFees().then(e => { setBaseFees(e) }),
        client.getPerPageFees().then(e => { setPerPageFees(e) }),
        client.getOwner(sld).then(e => { setOwner(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, sld, tryCatch])

  useEffect(() => {
    if (!isConnected || !chain || !switchNetwork) {
      return
    }
    if (chain.id !== config.chainId) {
      console.log(config.chainId)
      switchNetwork(config.chainId)
    }
  }, [isConnected, chain, switchNetwork])

  return (
    <Container>
      <FlexColumn style={{ alignItems: 'center', marginTop: 120, gap: 16 }}>
        <Title style={{ margin: 0 }}>{sld}.{config.tld}</Title>
        <SmallTextGrey>Connect your .country with notion pages</SmallTextGrey>
        {owner && <SmallTextGrey>Owner: {owner}</SmallTextGrey>}
      </FlexColumn>
      <DescLeft>
        {!isConnected && <Row style={{ justifyContent: 'center' }}><Button onClick={connect} style={{ width: 'auto' }}>CONNECT WALLET</Button></Row> }
      </DescLeft>
      {isConnected &&
        <DescLeft>
          <Row>
            <LabelText>Main page</LabelText>
            <InputBox $width={'100%'} value={pageId} placeholder={'ae42787a7d...'} onChange={({ target: { value } }) => { setPageId(value) }}/>
          </Row>
          <SmallTextGrey>This is the landing page when people visit web.{sld}.{config.tld} </SmallTextGrey>
          <LabelText style={{ marginTop: 32 }}>Additional pages</LabelText>
          <SmallTextGrey>Add additional pages potentially to be shown on web.{sld}.{config.tld}, so when visitors click a link that goes to the page, they will stay on your site. Otherwise, they will be directed to an external site (on notion.so)</SmallTextGrey>
          {allowedPageIds.map((pid, i) => {
            return <Row key={pid}>
              <InputBox $width={'100%'} value={pid} onChange={({ target: { value } }) => { setAllowedPageIds(e => [...e.slice(0, i), value, ...e.slice(i + 1)]) }}/>
              <Button disabled={initializing || pending} $width={'auto'} onClick={ () => { setAllowedPageIds(e => [...e.slice(0, i), ...e.slice(i + 1)]) }}>
                {pending ? <Loading/> : 'REMOVE' }
              </Button>
            </Row>
          })}
          <Row style={{ marginTop: 32, justifyContent: 'space-between' }}>
            <Button disabled={initializing || pending} $width={'auto'} onClick={ () => { setAllowedPageIds(e => [...e, '']) }}>{'ADD MORE'}</Button>
            <Button disabled={initializing || pending} $width={'auto'} onClick={ save}>{pending ? <Loading/> : 'SAVE ALL' }</Button>
          </Row>
          {totalFees.gt(0)
            ? <Row style={{ marginTop: 32 }}>
              <BaseText>Total fees: {ethers.utils.formatEther(totalFees)} ONE (base fees {ethers.utils.formatEther(baseFees)} ONE, plus per {ethers.utils.formatEther(perPageFees)} page)</BaseText>
            </Row>
            : <></>}
        </DescLeft>
      }

      <div style={{ height: 320 }}/>
      <Feedback/>
    </Container>)
}

export default Manage
