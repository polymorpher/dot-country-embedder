import React, { useEffect, useState } from 'react'
import { BaseText } from './components/Text'
import { apis, buildClient } from './api'
import { getPath, getSld, getSubdomain } from './utils'
import { useTryCatch } from './hooks/useTryCatch'
import { BlankPage, LoadingScreen } from './components/Misc'
import { LinkWrarpper } from './components/Controls'
import { FlexColumn } from './components/Layout'
import { replaceSubscribeWidget, replaceSubstackLink } from './LinkReplacer'
import './substack.scss'
import { segment } from '../../common/domain-utils'

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
      const initialStyles = Array.from(document.querySelectorAll('style'))
      html.style.visibility = 'hidden'
      html.innerHTML = replaceSubstackLink(page, { substackHost: pageId, subdomain, sld })
      // console.log(html.innerHTML)
      document.replaceChild(html, document.documentElement)
      const scripts = Array.from(document.querySelectorAll('script'))
      let loaded = 0
      const targetNumLoaded = scripts.filter(e => e.src?.includes('substack')).length

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

        if (script.noModule) {
          newScript.noModule = true
        }

        if (script.defer) {
          newScript.defer = true
        }

        const parent = script.parentNode

        script.remove()
        parent?.appendChild(newScript)
        newScript.addEventListener('load', () => {
          if (!newScript.src?.includes('substack')) {
            return
          }
          loaded += 1
          if (loaded < targetNumLoaded) {
            return
          }

          const root = document.createElement('div')
          const widgets = document.querySelectorAll('.subscribe-widget')
          widgets.forEach((w) => {
            // console.log(w)
            root.innerHTML = replaceSubscribeWidget(w.outerHTML, pageId ?? '')
            w.parentNode?.replaceChild(root, w)
          })
          console.log('loaded')
        })
      }

      const styles = Array.from(document.querySelectorAll("link[href$='.css']"))
      let loadedStyleCount = 0

      for (const style of styles) {
        const newStyle = style.cloneNode() as HTMLLinkElement
        style.remove()
        newStyle.onload = () => {
          loadedStyleCount += 1
          if (loadedStyleCount === styles.length) {
            html.style.visibility = 'visible'
          }
        }
        document.head.appendChild(newStyle)
      }
      for (const style of initialStyles) {
        const newStyle = style.cloneNode(true) as HTMLStyleElement
        style.remove()
        document.head.appendChild(newStyle)
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
          const [id, mode] = segment(e)
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
