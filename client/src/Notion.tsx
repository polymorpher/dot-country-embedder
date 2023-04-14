import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
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
import { NotionRenderer } from 'react-notion-x'
import 'react-notion-x/src/styles.css'

import { Code } from 'react-notion-x/build/third-party/code'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Equation } from 'react-notion-x/build/third-party/equation'
import { Modal } from 'react-notion-x/build/third-party/modal'
import { Pdf } from 'react-notion-x/build/third-party/pdf'
import { type ExtendedRecordMap } from 'notion-types'
import htmlReactParser, { Element as ParserElement, Text as ParserText } from 'html-react-parser'

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
const getPath = (): string => {
  if (!window) {
    return ''
  }
  return window.location.pathname
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

const LinkReplacer = ({ children, pageId }: { children: JSX.Element, pageId: string }): JSX.Element => {
  const str = renderToString(children)
  const el = htmlReactParser(str, {
    replace: (node) => {
      if (node.type !== 'tag' || !(node instanceof ParserElement)) {
        return
      }
      if (node.name === 'a') {
        // console.log(node)
        // console.log(node.attributes)
        // if (node.children?.[0] instanceof ParserText) {
        //   console.log(node.children?.[0]?.data)
        // } else {
        //   console.log(node.children)
        // }
        if (node.attribs.href.startsWith('http://') || node.attribs.href.startsWith('https://')) {
          return
        }
        let replaced = false
        for (const [i, attr] of node.attributes.entries()) {
          if (attr.name !== 'href') {
            continue
          }
          if (attr.value.startsWith('/' + pageId)) {
            console.log('replacing', attr.value, attr.value.slice(`/${pageId}`.length))
            node.attribs[attr.name] = attr.value.slice(`/${pageId}`.length)
            replaced = true
          }
          // else if (attr.value.startsWith('/')) {
          //   node.attribs[attr.name] = 'https://notion.so/' + attr.value.slice(1)
          //   replaced = true
          // }
        }
        if (replaced) {
          console.log(node)
          return node.cloneNode()
        }
      }
    }
  }) as JSX.Element
  return el
}
const Notion: React.FC = () => {
  const { address, isConnected } = useAccount()
  const provider = useProvider()
  const [client, setClient] = useState(buildClient())
  const { data: signer } = useSigner()
  const { connect } = useConnect({ connector: new InjectedConnector() })
  const [pending, setPending] = useState(true)
  const [initializing, setInitializing] = useState(true)
  const [page, setPage] = useState<ExtendedRecordMap>()
  const [pageId, setPageId] = useState<string>('ae42787a7d774e3bb86dcd897f720a0b')

  const sld = getSld()
  const path = getPath()

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
    if (!pageId) {
      return
    }
    void tryCatch(async function f () {
      const records = await apis.getNotionPage(pageId)
      setPage(records)
    })
  }, [pageId])

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

  // useEffect(() => {
  //   if (!pageId) {
  //     return
  //   }
  //   console.log(path, pageId)
  //   if (path === '/' + pageId) {
  //     const url = new URL(window.location.href)
  //     url.pathname = '/'
  //     console.log(url)
  //     console.log(url.href)
  //     console.log(url.toString())
  //     history.replaceState(null, '', url.href)
  //   }
  // }, [pageId, path])

  if (!page) {
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
  return <LinkReplacer pageId={pageId}>
    <NotionRenderer
      recordMap={page}
      fullPage={true}
      darkMode={false}
      components={{
        Code,
        Collection,
        Equation,
        Modal,
        Pdf
      }}/>
  </LinkReplacer>
}

export default Notion
