import React, { useEffect, useRef, useState } from 'react'
import { BaseText } from './components/Text'
import { apis, buildClient } from './api'
import { getPath, getSld, getSubdomain } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'
import parse from 'html-react-parser'
import { parsePath } from '../../common/notion-utils'
import './substack.scss'
import { SubstackLinkReplacer } from './LinkReplacer'
const Substack: React.FC = () => {
  const [client] = useState(buildClient())
  const [page, setPage] = useState<string>()
  // set "https://polymorpher.substack.com" to `pageId` for test purpose
  const [pageId, setPageId] = useState<string>()
  const [unrestrictedMode, setUnrestrictedMode] = useState<boolean>(true)
  const sld = getSld()
  const subdomain = getSubdomain()
  const pageIdOverride = getPath().slice(1)

  const { pending, initializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }

    void tryCatch(async function f () {
      const page = await apis.getSubstackPage(pageIdOverride) as string
      const substackScripts = Array.from(window.document.querySelectorAll('script[created-from=substack]'))

      if (substackScripts.length === 0) {
        const newDiv = document.createElement('div')
        newDiv.innerHTML = page
        const scripts = Array.from(newDiv.querySelectorAll('script'))
        for (const script of scripts) {
          const newScript = document.createElement('script')
          if (newScript.src) {
            newScript.src = script.src
          }
          if (newScript.type) {
            newScript.type = script.type
          }
          if (newScript.innerHTML) {
            newScript.innerHTML = script.innerHTML
          }
          newScript.setAttribute('created-from', 'substack')
          document.body.appendChild(newScript)
        }
        newDiv.remove()
      }
      setPage(page)
    })
  }, [pageId, pageIdOverride, tryCatch, unrestrictedMode])

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
        })
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
          This site has not connected with any substack page<br/><br/>
          If you are the owner, please visit <LinkWrarpper href={'/manage'}>here</LinkWrarpper> to configure the site
        </BaseText>
      </FlexColumn>
    </BlankPage>
  }

  if (pending) {
    return <LoadingScreen/>
  }

  if (!page) {
    return <LoadingScreen/>
  }

  const parsedPage = parse(page) as JSX.Element
  return <>

    <SubstackLinkReplacer substackHost={pageId} subdomain={subdomain} sld={sld}>
      {parsedPage}
    </SubstackLinkReplacer>
  </>
  // return <>{parsedPage}</>
  // return <div dangerouslySetInnerHTML={{ __html: page }}></div>
}

export default Substack
