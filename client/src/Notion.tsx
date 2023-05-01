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
import { type Block, type ExtendedRecordMap } from 'notion-types'
import htmlReactParser, { Element as ParserElement } from 'html-react-parser'
import { getPath, getSld } from './utils'
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
              node.attribs[attr.name] = attr.value.slice(`/${pageId}`.length)
              replaced = true
            } else {
              const matchedPageIds = allowedPageIds.filter(e => attr.value.startsWith(`/${e}`))
              if (attr.value.startsWith('/') && matchedPageIds.length === 0) {
                node.attribs[attr.name] = `https://notion.so/${attr.value.slice(1)}`
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

const extractTitle = (page: ExtendedRecordMap): string => {
  const blocks = Object.entries(page.block)
  return blocks[0][1].value.properties?.title?.flat().join(' ')
}

const extractPageCover = (page: ExtendedRecordMap): string | undefined => {
  const blocks = Object.entries(page.block)
  return blocks[0][1].value?.format?.page_cover
}

const extractTextFromBlock = (block: { role: string, value: Block }): string => {
  if (block.value.type === 'text') {
    return block?.value?.properties?.title?.flat().join(' ') as string
  }
  return ''
}
const extractDescription = (page: ExtendedRecordMap): string => {
  const blocks = Object.entries(page.block)
  let currentBlock = blocks[0][1]
  if (!currentBlock) {
    return ''
  }
  if (!currentBlock.value.content) {
    return ''
  }
  const blockPaths = [...currentBlock.value.content].reverse()
  currentBlock = page.block[blockPaths.pop() as string]
  let desc = extractTextFromBlock(currentBlock)
  if (desc) {
    return desc
  }
  while (!desc) {
    if (currentBlock.value?.content) {
      blockPaths.push(...(currentBlock.value.content.reverse()))
    }
    if (blockPaths.length === 0) {
      return ''
    }
    currentBlock = page.block[blockPaths.pop() as string]
    desc = extractTextFromBlock(currentBlock)
    if (desc) {
      return desc
    }
  }
  return ''
}

const makeEmojiDataUrl = (emoji: string): string => {
  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`
}

const extractEmoji = (text: string): string => {
  const m = text.match(/(\p{EPres}|\p{ExtPict})(\u200d(\p{EPres}|\p{ExtPict}))*/gu)
  if (m) {
    return m[0]
  }
  return ''
}

const Notion: React.FC = () => {
  const [client] = useState(buildClient())
  const [page, setPage] = useState<ExtendedRecordMap>()
  // const [pageId, setPageId] = useState<string>('ae42787a7d774e3bb86dcd897f720a0b')
  const [pageId, setPageId] = useState<string>('')
  // const [allowedPageIds, setAllowedPageIds] = useState<string[]>(['7bebb4bb632c4fd985a0f816518b853f', '82036c958834437786427b83ca55bfbe'])
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])
  const sld = getSld()
  const pageIdOverride = getPath().slice(1)

  const { pending, initializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }
    console.log(pageIdOverride, pageId, allowedPageIds)
    if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
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
        client.getLandingPage(sld).then(e => { setPageId(e) }),
        client.getAllowedPages(sld).then(e => { setAllowedPageIds(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, sld, tryCatch])

  if (initializing) {
    return <LoadingScreen/>
  }

  if (!pageId) {
    return <BlankPage>
      <FlexColumn style={{ textAlign: 'center' }}>
        <BaseText>
          This site has not connected with any notion page          <br/><br/>
          If you are the owner, please visit <LinkWrarpper href={'/manage'}>here</LinkWrarpper> to configure the site

        </BaseText>
      </FlexColumn>
    </BlankPage>
  }

  if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
    return <Navigate to={'/manage'}/>
  }

  if (pending) {
    // return <LoadingScreen><BaseText>Loading Content...</BaseText></LoadingScreen>
    return <LoadingScreen/>
  }

  if (!page) {
    // return <LoadingScreen><BaseText>Rendering Page...</BaseText></LoadingScreen>
    return <LoadingScreen/>
  }
  const title = extractTitle(page)
  const desc = extractDescription(page)
  const coverImageUrl = extractPageCover(page)
  const emoji = extractEmoji(title) || extractEmoji(desc)
  console.log({ title, desc, coverImageUrl, emoji })
  // return <div>
  //   <Tweet id={'1324595039742222337'} />
  //   <Tweet id={'1466447129178783744'} />
  // </div>
  return <>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc}/>
      {emoji && <link rel="icon" href={makeEmojiDataUrl(emoji) } />}
      {coverImageUrl && <meta property="og:image" content="http://qokka.ai/{{{imagePath}}}"/>}
      <meta property="og:url" content={`https://${sld}.${config.tld}/${pageIdOverride}`}/>
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={desc}/>
    </Helmet>
    <NotionRenderer
      recordMap={page}
      fullPage={true}
      darkMode={false}
      components={{
        Code,
        Collection,
        Equation,
        Modal,
        Pdf,
        Tweet
      }}/>
  </>
  // return <LinkReplacer pageId={pageId} allowedPageIds={allowedPageIds}>
  //   <NotionRenderer
  //     recordMap={page}
  //     fullPage={true}
  //     darkMode={false}
  //     components={{
  //       Code,
  //       Collection,
  //       Equation,
  //       Modal,
  //       Pdf,
  //       Tweet
  //     }}/>
  // </LinkReplacer>
}

export default Notion
