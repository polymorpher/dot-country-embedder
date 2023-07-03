import React, { useEffect, useState } from 'react'
import { BaseText } from './components/Text'
import { apis, buildClient } from './api'
import { NotionRenderer } from 'react-notion-x'
import { Code } from 'react-notion-x/build/third-party/code'
import TweetEmbed from 'react-tweet-embed'
import { Collection } from 'react-notion-x/build/third-party/collection'
import { Modal } from 'react-notion-x/build/third-party/modal'
// too large, to be enabled later when lazy loading is guaranteed to work
// import { Pdf } from 'react-notion-x/build/third-party/pdf'
// import { Equation } from 'react-notion-x/build/third-party/equation'
import {
  extractTitle,
  extractDescription,
  extractPageCover,
  extractPageEmoji,
  makeEmojiDataUrl,
  extractEmoji,
  isValidNotionPageId,
  parsePath,
  urlNormalize
} from '../../common/notion-utils'
import { type ExtendedRecordMap } from 'notion-types'
import { getPath, getSld, getSubdomain, titleEmbeddedMapPageUrl } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { Navigate } from 'react-router-dom'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'
import { Helmet } from 'react-helmet'
import config from '../config'
import './notion.scss'
import { toast } from 'react-toastify'

const Tweet = ({ id }: { id: string }): JSX.Element => {
  return <TweetEmbed tweetId={id} />
}

const Notion: React.FC = () => {
  const [client] = useState(buildClient(undefined, undefined, true))
  const [page, setPage] = useState<ExtendedRecordMap>()
  const [pageId, setPageId] = useState<string>('')
  const [unrestrictedMode, setUnrestrictedMode] = useState<boolean>(true)
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])
  const sld = getSld()
  const subdomain = getSubdomain()
  const pageIdOverride = parsePath(getPath().slice(1))

  const { pending, initializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }
    // console.log(pageIdOverride, pageId, allowedPageIds)
    if (pageIdOverride && !unrestrictedMode && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
      return
    }
    const renderedPageId = pageIdOverride || pageId

    void tryCatch(async function f () {
      let records: ExtendedRecordMap
      try {
        records = await apis.getNotionPage(renderedPageId)
      } catch (ex: any) {
        console.error(ex)
        toast.error('Cannot retrieve notion page. Please make sure it is published')
        return
      }
      const title = extractTitle(Object.values(records.block))
      if (title) {
        const stub = urlNormalize(title)
        if (pageIdOverride && pageIdOverride !== pageId) {
          // console.log(pageIdOverride, pageId)
          history.pushState({}, '', `${config.titleUrlPrefix}${stub}-${renderedPageId}`)
        }
      }
      setPage(records)
    })
  }, [pageId, pageIdOverride, allowedPageIds, tryCatch, unrestrictedMode])
  useEffect(() => {
    if (!page) {
      return
    }
    const el = document.querySelector('.notion-page-cover')
    el?.setAttribute('fetchpriority', 'high')
  }, [page])

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
        client.getLandingPage(sld, subdomain).then(e => {
          const [id, mode] = e.split(':')
          if (mode === 'strict') {
            setUnrestrictedMode(false)
          }
          setPageId(id)
        }),
        client.getAllowedPages(sld, subdomain).then(e => { setAllowedPageIds(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [client, sld, subdomain, tryCatch])

  if (initializing) {
    return <LoadingScreen/>
  }

  if (!pageId) {
    return <BlankPage>
      <FlexColumn style={{ textAlign: 'center' }}>
        <BaseText>
          This site has not connected with any page <br/><br/>
          If you are the owner, please visit <LinkWrarpper href={'/manage'}>here</LinkWrarpper> to configure or restore the site
        </BaseText>
      </FlexColumn>
    </BlankPage>
  }

  if (pageIdOverride && !unrestrictedMode && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
    if (isValidNotionPageId(pageIdOverride)) {
      // return <Navigate to={`https://notion.so/${pageIdOverride}`}/>
      window.location.href = `https://notion.so/${pageIdOverride}`
      return <LoadingScreen/>
    }
    return <Navigate to={'/manage'}/>
  }

  if (pageIdOverride && unrestrictedMode && !isValidNotionPageId(pageIdOverride)) {
    return <Navigate to={'/'}/>
  }

  if (pending) {
    // return <LoadingScreen><BaseText>Loading Content...</BaseText></LoadingScreen>
    return <LoadingScreen/>
  }

  if (!page) {
    // return <LoadingScreen><BaseText>Rendering Page...</BaseText></LoadingScreen>
    return <LoadingScreen/>
  }
  const blocks = Object.values(page.block)
  const title = extractTitle(blocks)
  const desc = extractDescription(page)
  const coverImageUrl = extractPageCover(blocks)
  const emoji = (extractPageEmoji(blocks) ?? extractEmoji(title)) || extractEmoji(desc)
  // console.log({ title, desc, coverImageUrl, emoji })
  // return <div>
  //   <Tweet id={'1324595039742222337'} />
  //   <Tweet id={'1466447129178783744'} />
  // </div>
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
      recordMap={page}
      fullPage={true}
      darkMode={false}
      rootPageId={pageId}
      mapPageUrl={titleEmbeddedMapPageUrl(pageId, page)}
      components={{
        Code,
        Collection,
        // Equation,
        Modal,
        // Pdf,
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
