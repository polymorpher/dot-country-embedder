import React, { useEffect, useState } from 'react'
import { BaseText } from './components/Text'
import { apis, buildClient } from './api'
import { getPath, getSld, getSubdomain } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'
import { replaceSubstackLink } from './LinkReplacer'

const Substack: React.FC = () => {
  const [client] = useState(buildClient())
  const [pageId, setPageId] = useState<string>()
  const [unrestrictedMode, setUnrestrictedMode] = useState<boolean>(true)
  const sld = getSld()
  const subdomain = getSubdomain()
  const pageIdOverride = getPath().slice(1)

  const { initializing, tryCatch } = useTryCatch()

  useEffect(() => {
    if (!pageId) {
      return
    }

    void tryCatch(async function f () {
      const page = await apis.getSubstackPage(pageIdOverride) as string
      const html = document.createElement('html')

      html.innerHTML = replaceSubstackLink(page, { substackHost: pageId, subdomain, sld })
      document.replaceChild(html, document.documentElement)

      const scripts = Array.from(document.querySelectorAll('script'))

      for (const script of scripts) {
        const newScript = document.createElement('script')

        if (script.src) {
          newScript.src = script.src
        }

        if (script.type) {
          newScript.type = script.type
        }

        if (script.innerHTML) {
          newScript.innerHTML = script.innerHTML
        }

        const parent = script.parentNode
        script.remove()

        parent?.appendChild(newScript)
      }

      const icons = Array.from(document.querySelectorAll("link[rel$='icon']"))

      for (const icon of icons) {
        const newIcon = icon.cloneNode()
        icon.remove()
        document.head.appendChild(newIcon)
      }
    })
  }, [pageId, pageIdOverride, sld, subdomain, tryCatch, unrestrictedMode])

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
          If you are the owner, please visit
          <LinkWrarpper href={'/manage'}>here</LinkWrarpper>
          to configure the site
        </BaseText>
      </FlexColumn>
    </BlankPage>
  }

  return <LoadingScreen/>
}

export default Substack
