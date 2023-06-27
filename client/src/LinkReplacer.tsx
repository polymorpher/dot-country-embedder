
import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
import htmlReactParser from 'html-react-parser'
import { Element as ParserElement } from 'domhandler/lib/node'
import { LoadingScreen } from './components/Misc'

interface NotionLinkReplacerConfig {
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

export const SubstackLinkReplacer = ({ children, pageId, allowedPageIds = [] }: NotionLinkReplacerConfig): JSX.Element => {
  const [element, setElement] = useState<JSX.Element>(<LoadingScreen/>)
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
