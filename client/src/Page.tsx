import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'

import { BaseText } from './components/Text'
import { apis, buildClient } from './api'

import { NotionRenderer } from 'react-notion-x'
import 'react-notion-x/src/styles.css'

import { Code } from 'react-notion-x/build/third-party/code'
import TweetEmbed from 'react-tweet-embed'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Equation } from 'react-notion-x/build/third-party/equation'
import { Modal } from 'react-notion-x/build/third-party/modal'
import { Pdf } from 'react-notion-x/build/third-party/pdf'
import { extractTitle, extractDescription, extractPageCover, extractPageEmoji, makeEmojiDataUrl, extractEmoji, isValidNotionPageId } from '../../common/notion-utils'
import { type ExtendedRecordMap } from 'notion-types'
import htmlReactParser, { Element as ParserElement } from 'html-react-parser'
import { getPath, getSld, getSubdomain } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { Navigate } from 'react-router-dom'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'
import { Helmet } from 'react-helmet'
import config from '../config'

interface LinkReplacerConfig {
  children: JSX.Element
  pageId: string
  allowedPageIds: string[]
}

// DEPRECATED: TODO: this doesn't work with pages that have iframe, which is needed by tweets. We probably don't need this anymore, since we now have recursive crawler which can set allowed-pages correctly in the first place.
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
              node.attribs.href = attr.value.slice(`/${pageId}`.length)
              replaced = true
            } else {
              const matchedPageIds = allowedPageIds.filter(e => attr.value.startsWith(`/${e}`))
              if (attr.value.startsWith('/') && matchedPageIds.length === 0) {
                node.attribs.href = `https://notion.so/${attr.value.slice(1)}`
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

const Tweet = ({ id }: { id: string }): JSX.Element => {
  return <TweetEmbed tweetId={id} />
}

const sld = getSld()
const subdomain = getSubdomain()
const pageIdOverride = getPath().slice(1)

const notion = config.embedPlatform === 'notion'

const Page: React.FC = () => {
  const [client] = useState(buildClient())
  const [page, setPage] = useState<ExtendedRecordMap | string>()
  const [pageId, setPageId] = useState<string>('https://polymorpher.substack.com')
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])

  const { pending, initializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }
    // console.log(pageIdOverride, pageId, allowedPageIds)
    if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
      return
    }

    void tryCatch(async function f () {
      if (notion) {
        const records = await apis.getNotionPage(pageIdOverride || pageId)
        setPage(records)
      } else {
        const page = await apis.getPage(pageId + '/' + pageIdOverride) as string
        const newDiv = document.createElement('div')

        newDiv.innerHTML = page

        const scripts = Array.from(newDiv.querySelectorAll('script'))
        const oldScripts = Array.from(window.document.querySelectorAll('script[created-from=substack]'))

        for (const script of oldScripts) {
          script.remove()
        }

        for (const script of scripts) {
          const newScript = document.createElement('script')

          if (script.src) {
            newScript.src = script.src
          }

          if (script.innerHTML) {
            newScript.innerHTML = script.innerHTML
          }

          newScript.setAttribute('created-from', 'substack')
          document.body.appendChild(newScript)
        }

        newDiv.remove()

        setPage(page)
      }
    })
  }, [pageId, allowedPageIds, tryCatch])

  useEffect(() => {
    return () => {
      const oldScripts = Array.from(window.document.querySelectorAll('script[created-from=substack]'))

      for (const script of oldScripts) {
        script.remove()
      }
    }
  }, [])

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
        client.getLandingPage(sld, subdomain).then(e => { setPageId(e) }),
        client.getAllowedPages(sld, subdomain).then(e => { setAllowedPageIds(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, tryCatch])

  if (initializing) {
    return <LoadingScreen/>
  }

  if (!pageId) {
    return (
      <BlankPage>
        <FlexColumn style={{ textAlign: 'center' }}>
          <BaseText>
            This site has not connected with any notion page<br/><br/>
            If you are the owner, please visit <LinkWrarpper href={'/manage'}>here</LinkWrarpper> to configure the site
          </BaseText>
        </FlexColumn>
      </BlankPage>
    )
  }

  if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
    if (isValidNotionPageId(pageIdOverride)) {
      return <Navigate to={`https://notion.so/${pageIdOverride}`}/>
    }
    return <Navigate to={'/manage'}/>
  }

  if (pending) {
    return <LoadingScreen/>
  }

  if (!page) {
    return <LoadingScreen/>
  }

  if (!notion) {
    return (
      <div dangerouslySetInnerHTML={{ __html: page as string }} />
    )
  }

  const blocks = Object.values((page as ExtendedRecordMap).block)
  const title = extractTitle(blocks)
  const desc = extractDescription(page as ExtendedRecordMap)
  const coverImageUrl = extractPageCover(blocks)
  const emoji = (extractPageEmoji(blocks) ?? extractEmoji(title)) || extractEmoji(desc)

  return <>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc}/>
      {emoji && <link rel="icon" href={makeEmojiDataUrl(emoji) } />}
      {coverImageUrl && <meta property="og:image" content={coverImageUrl}/>}
      <meta property="og:url" content={`https://${sld}.${config.tld}/${pageIdOverride}`}/>
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={desc}/>
    </Helmet>
    <NotionRenderer
      recordMap={page as ExtendedRecordMap}
      fullPage={true}
      darkMode={false}
      rootPageId={pageId}
      components={{
        Code,
        Collection,
        Equation,
        Modal,
        Pdf,
        Tweet
      }}/>
  </>
}

export default Page
