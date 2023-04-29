import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import { uniq } from 'lodash-es'
const notion = new NotionAPI()

const axiosBase = axios.create({ timeout: 15000 })

const HexRegex = /[0-9a-f]+/
export const isValidateNotionPageId = (id: string): boolean => {
  if (id.length !== 32) {
    return false
  }
  if (!id.match(HexRegex)) {
    return false
  }
  return true
}

export async function getPage (id: string): Promise<ExtendedRecordMap> {
  return await notion.getPage(id)
}

export async function getNotionPageId (url: string): Promise<string> {
  const validatedUrl = new URL(url)
  url = validatedUrl.href
  const { data } = await axiosBase.get(url)
  const dom = new JSDOM(data)
  const notionDataRaw = dom.window.document.querySelector('#__NEXT_DATA__')
  if (!notionDataRaw) {
    throw new Error(`No notion data found on url ${url}`)
  }
  const notionData = JSON.parse(notionDataRaw.innerHTML)
  const pageId = notionData?.props?.pageProps?.records?.pageId
  if (!pageId) {
    console.log(`no page id from notion data at ${url}:`, JSON.stringify(notionData))
    return ''
  }
  return pageId
}

function extractInternalLinksFromProperties (props): string[] {
  // console.log(props)
  if (props instanceof Array && props[0] === 'a' && typeof props[1] === 'string') {
    return [props[1]]
  }
  if (props instanceof Array) {
    return props.filter(e => e instanceof Array || e instanceof Object).flatMap(extractInternalLinksFromProperties)
  }
  if (props instanceof Object) {
    return Object.entries(props).flatMap(([k, v]) => extractInternalLinksFromProperties(v))
  }
  return []
}
function cleanLink (link: string): string {
  if (!link) {
    return ''
  }
  if (link.includes('?')) {
    return link.split('?')[0]
  }
  return link.split('#')[0]
}
export async function getAllPageIds (id: string, depth: number = 0): Promise<string[]> {
  let ret: string[] = []
  let root: ExtendedRecordMap
  try {
    root = await getPage(id)
  } catch (ex) {
    console.error(`Error retrieving for page id ${id}`, ex)
    return ret
  }
  for (const [, block] of Object.entries(root.block)) {
    const props = block?.value?.properties
    if (!props) {
      continue
    }
    const links = extractInternalLinksFromProperties(props)
    const uniqueLinks = uniq(links.map(cleanLink)).filter(e => e !== `/${id}`)
    const filteredUniqueLinks = uniqueLinks.filter(e => e.startsWith('/'))
    if (filteredUniqueLinks.length === 0) {
      continue
    }
    // console.log(id, filteredUniqueLinks)
    ret.push(...filteredUniqueLinks)
    ret = uniq(ret)
  }
  if (depth === 0) {
    return ret.map(e => e.slice(1))
  }

  const promises = ret.map(async pageId => await getAllPageIds(pageId.slice(1), depth - 1))
  const linkGroups = await Promise.all(promises)
  return [...ret, ...linkGroups.flat()].map(e => e.slice(1))
}
