import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
import htmlReactParser, { Element as ParserElement } from 'html-react-parser'
import { LoadingScreen } from './components/Misc'
import config from '../config'

export interface NotionLinkReplacerConfig {
  children: JSX.Element
  pageId: string
  allowedPageIds: string[]
}

// DEPRECATED: TODO: this doesn't work with pages that have iframe, which is needed by tweets. We probably don't need this anymore, since we now have recursive crawler which can set allowed-pages correctly in the first place.
export const NotionLinkReplacer = ({ children, pageId, allowedPageIds = [] }: NotionLinkReplacerConfig): JSX.Element => {
  const [element, setElement] = useState<JSX.Element>(<></>)
  useEffect(() => {
    const str = renderToString(children)
    setElement(htmlReactParser(str, {
      replace: (node) => {
        if (node.type !== 'tag' || !(node instanceof ParserElement)) {
          return
        }

        if (node.name === 'a') {
          if (!node.attribs.href) {
            return
          }
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

export interface SubstackLinkReplacerConfig {
  children?: JSX.Element
  sld: string
  subdomain: string
  substackHost: string
}

export const replaceSubstackLink = (html: string, { sld, subdomain, substackHost }: SubstackLinkReplacerConfig): string => {
  const replacementHost = `${subdomain}.${sld}.${config.tld}`
  return html.replaceAll(`http://${substackHost}`, `http://${replacementHost}`)
    .replaceAll(`https://${substackHost}`, `https://${replacementHost}`)
    .replaceAll('https://substack.com/profile', `https://${sld}.${config.tld}`)
}

export const SubstackLinkReplacer = ({ children, sld, subdomain, substackHost }: SubstackLinkReplacerConfig): JSX.Element => {
  const [element, setElement] = useState<JSX.Element>(<LoadingScreen/>)
  useEffect(() => {
    const str = renderToString(children)
    setElement(htmlReactParser(str, {
      replace: (node) => {
        if (node.type !== 'tag' || !(node instanceof ParserElement)) {
          return
        }
        const replacementHost = `${subdomain}.${sld}.${config.tld}`
        // const replacementHost = `${subdomain}.${sld}.localhost:3100`

        if (node.name === 'a') {
          const h = node.attribs.href
          if (!h) {
            return
          }
          if (h.startsWith(`http://${substackHost}`) || h.startsWith(`https://${substackHost}`)) {
            node.attribs.href = node.attribs.href.replace(substackHost, replacementHost)
            return node.cloneNode()
          }
          if (h.startsWith('https://substack.com/profile')) {
            node.attribs.href = `https://${sld}.${config.tld}`
            return node.cloneNode()
          }
        }
        if (node.attribs.class === 'subscribe-widget') {
          return <iframe src={`https://${substackHost}/embed`} frameBorder="0" scrolling="no"/>
        }
      }
    }) as JSX.Element)
  }, [children, sld, subdomain, substackHost])
  return element
}
