import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'

import { BaseText } from './components/Text'
import { buildClient, apis } from './api'

import { NotionRenderer } from 'react-notion-x'
import 'react-notion-x/src/styles.css'

import { Code } from 'react-notion-x/build/third-party/code'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Equation } from 'react-notion-x/build/third-party/equation'
import { Modal } from 'react-notion-x/build/third-party/modal'
import { Pdf } from 'react-notion-x/build/third-party/pdf'
import { type ExtendedRecordMap } from 'notion-types'
import htmlReactParser, { Element as ParserElement } from 'html-react-parser'
import { getPath, getSld } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { Navigate } from 'react-router-dom'
import { LoadingScreen } from './components/Misc'

interface LinkReplacerConfig {
  children: JSX.Element
  pageId: string
  allowedPageIds: string[]
}

const LinkReplacer = ({ children, pageId, allowedPageIds = [] }: LinkReplacerConfig): JSX.Element => {
  const [element, setElement] = useState<JSX.Element>(<></>)
  useEffect(() => {
    const str = renderToString(children)
    setElement(htmlReactParser(str, {
      replace: (node) => {
        if (node.type !== 'tag' || !(node instanceof ParserElement)) {
          return
        }
        if (node.name === 'a') {
          if (node.attribs.href.startsWith('http://') || node.attribs.href.startsWith('https://')) {
            return
          }
          let replaced = false
          for (const attr of node.attributes) {
            if (attr.name !== 'href') {
              continue
            }
            if (attr.value.startsWith('/' + pageId)) {
              // console.log('replacing', attr.value, attr.value.slice(`/${pageId}`.length))
              node.attribs[attr.name] = attr.value.slice(`/${pageId}`.length)
              replaced = true
            } else {
              const matchedPageIds = allowedPageIds.filter(e => attr.value.startsWith(`/${e}`))
              if (attr.value.startsWith('/') && matchedPageIds.length === 0) {
                node.attribs[attr.name] = 'https://notion.so/' + attr.value.slice(1)
                replaced = true
              }
            }
          }
          if (replaced) {
            return node.cloneNode()
          }
        }
      }
    }) as JSX.Element)
  }, [children, pageId, allowedPageIds])
  return element
}
const Notion: React.FC = () => {
  const [client] = useState(buildClient())
  const [page, setPage] = useState<ExtendedRecordMap>()
  const [pageId, setPageId] = useState<string>('ae42787a7d774e3bb86dcd897f720a0b')
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>(['7bebb4bb632c4fd985a0f816518b853f', '82036c958834437786427b83ca55bfbe'])
  const sld = getSld()
  const pageIdOverride = getPath().slice(1)

  const { pending, setPending, initializing, setInitializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }
    if (pageIdOverride && !allowedPageIds.includes(pageIdOverride)) {
      return
    }
    const renderedPageId = pageIdOverride || pageId

    void tryCatch(async function f () {
      const records = await apis.getNotionPage(renderedPageId)
      setPage(records)
    })
  }, [pageId, pageIdOverride, allowedPageIds, tryCatch])

  useEffect(() => {
    // @ts-expect-error debugging
    window.client = client
  }, [client])

  useEffect(() => {
    if (!client || !sld) {
      return
    }

    tryCatch(async () => {
      return await Promise.all([
        new Promise((resolve) => { resolve(1) })
        // TODO - get allowed page ids, get page id
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, sld, tryCatch])

  if (initializing) {
    return <LoadingScreen/>
  }

  if (pageIdOverride && !allowedPageIds.includes(pageIdOverride)) {
    return <Navigate to={'/manage'}/>
  }

  if (!page) {
    return <LoadingScreen><BaseText>Loading Content...</BaseText></LoadingScreen>
  }

  return <LinkReplacer pageId={pageId} allowedPageIds={allowedPageIds}>
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
