import React, { useEffect, useState } from 'react'
import { useAccount, useConnect, useProvider, useSigner } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { ethers } from 'ethers'
import config from '../config'
import { Button, Input, LinkWrarpper } from './components/Controls'
import { BaseText, Desc, FloatingText, SmallText, Title } from './components/Text'
import { FlexColumn, FlexRow, Main } from './components/Layout'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import { buildClient, apis } from './api'
import { TailSpin } from 'react-loading-icons'
import { Feedback } from './components/Misc'
import useDebounce from './hooks/useDebounce'
import 'react-notion-x/src/styles.css'
import { Code } from 'react-notion-x/build/third-party/code'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Equation } from 'react-notion-x/build/third-party/equation'
import { Modal } from 'react-notion-x/build/third-party/modal'
import { Pdf } from 'react-notion-x/build/third-party/pdf'

const Container = styled(Main)`
  margin: 0 auto;
  padding: 0 16px;
  max-width: 800px;
  // TODO: responsive
`

const Loading: React.FC = () => {
  return <TailSpin stroke='grey' width={16} height={16} />
}
const SmallTextGrey = styled(SmallText)`
  color: grey;
`

const getSld = (): string => {
  if (!window) {
    return ''
  }
  const host = window.location.host
  const parts = host.split('.')
  if (parts.length <= 1) {
    return ''
  }
  return parts[parts.length - 2]
}

const InputBox = styled(Input)`
  border-bottom: none;
  font-size: 12px;
  margin: 0;
  background: #e0e0e0;
  &:hover{
    border-bottom: none;
  }
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

const Notion: React.FC = () => {
  const { address, isConnected } = useAccount()
  const provider = useProvider()
  const [client, setClient] = useState(buildClient())
  const { data: signer } = useSigner()
  const { connect } = useConnect({ connector: new InjectedConnector() })
  const [pending, setPending] = useState(true)
  const [initializing, setInitializing] = useState(true)

  const sld = getSld()

  const tryCatch = async (f: () => Promise<any>, isInit?: boolean): Promise<void> => {
    try {
      if (isInit) {
        setInitializing(true)
      } else {
        setPending(true)
      }
      await f()
    } catch (ex) {
      console.error(ex)
      // @ts-expect-error catch error in response
      if (ex?.response?.error) {
        // @ts-expect-error catch error in response
        toast.error(`Request failed. Error: ${ex?.response?.error}`)
      }
      toast.info('Request cancelled')
    } finally {
      if (isInit) {
        setInitializing(false)
      } else {
        setPending(false)
      }
    }
  }

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
    if (!client || !sld) {
      return
    }
    tryCatch(async () => {
      return await Promise.all([
        // TODO
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, sld])

  return (
    <Container>
      <FlexColumn style={{ alignItems: 'center', marginTop: 120, gap: 16 }}>
        <Title style={{ margin: 0 }}>{sld}.{config.tld}</Title>
        <SmallTextGrey>Embed your notion page</SmallTextGrey>
      </FlexColumn>
      <Desc>
        {isConnected && <BaseText>address: {address}</BaseText>}
        {!isConnected && <Button onClick={connect} style={{ width: 'auto' }}>CONNECT WALLET</Button>}
      </Desc>
      <div style={{ height: 320 }}/>
      <Feedback/>
    </Container>)
}

export default Notion
