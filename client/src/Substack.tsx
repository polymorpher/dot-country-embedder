import React, { useEffect, useState } from 'react'
import { BaseText } from './components/Text'
import { apis, buildClient } from './api'
import { parsePath } from '../../common/notion-utils'
import { getPath, getSld, getSubdomain } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { Navigate } from 'react-router-dom'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'

const sld = getSld()
const subdomain = getSubdomain()
const pageIdOverride = parsePath(getPath().slice(1))

const client = buildClient()

const Substack: React.FC = () => {
  const [page, setPage] = useState<string>()
  // set "https://polymorpher.substack.com" to `pageId` for test purpose
  const [pageId, setPageId] = useState<string>()
  // set ["archive"] to `allowedPageIds` for test purpose
  const [allowedPageIds, setAllowedPageIds] = useState<string[]>([])

  const { pending, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }
    // console.log(pageIdOverride, pageId, allowedPageIds)
    if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
      return
    }

    void tryCatch(async function f () {
      const page = await apis.getSubstackPage(`${pageId}/${pageIdOverride}`) as string
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
    if (!client || !sld) {
      return
    }

    tryCatch(async () => {
      return await Promise.all([
        client.getLandingPage(sld, subdomain).then(e => { setPageId(e) }),
        client.getAllowedPages(sld, subdomain).then(e => { setAllowedPageIds(e) })
      ])
    }, true).catch(e => { console.error(e) })
  }, [tryCatch])

  if (pending) {
    return <LoadingScreen/>
  }

  if (!pageId) {
    return (
      <BlankPage>
        <FlexColumn style={{ textAlign: 'center' }}>
          <BaseText>
            This site has not connected with any substack page<br/><br/>
            If you are the owner, please visit <LinkWrarpper href={'/manage'}>here</LinkWrarpper> to configure the site
          </BaseText>
        </FlexColumn>
      </BlankPage>
    )
  }

  if (pageIdOverride && !allowedPageIds.includes(pageIdOverride) && pageIdOverride !== pageId) {
    return <Navigate to={'/manage'}/>
  }

  if (pending) {
    return <LoadingScreen/>
  }

  if (!page) {
    return <LoadingScreen/>
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: page }} />
  )
}

export default Substack
