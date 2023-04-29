import { NotionAPI } from 'notion-client'
import { type Block, type ExtendedRecordMap, type Role } from 'notion-types'
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

function extractBlockIdsFromProperties (props): string[] {
  if (props instanceof Array && props[0] === 'p' && typeof props[1] === 'string' && props[1].length === 36) {
    return [props[1]]
  }
  if (props instanceof Array) {
    return props.filter(e => e instanceof Array || e instanceof Object).flatMap(extractBlockIdsFromProperties)
  }
  if (props instanceof Object) {
    return Object.entries(props).flatMap(([k, v]) => extractBlockIdsFromProperties(v))
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

function cleanId (id: string): string {
  return id.replaceAll('-', '')
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
  const blocks: Array<[string, { role: Role, value: Block }]> = Object.entries(root.block)
  const contentIds = blocks[0][1].value.content
  if (!contentIds) {
    return ret
  }
  for (const cid of contentIds) {
    const block = root.block[cid]
    if (!block) {
      continue
    }
    if (block.value.type === 'page') {
      console.log('page id', cid)
      ret.push(cleanId(cid))
    } else if (block.value.type === 'text') {
      const embeddedIds = extractBlockIdsFromProperties(block.value.properties)
      const links = extractInternalLinksFromProperties(block.value.properties)
      const uniqueLinks = uniq(links.map(cleanLink)).filter(e => e !== `/${id}`)
      const filteredUniqueLinks = uniqueLinks.filter(e => e.startsWith('/')).map(e => e.slice(1))
      const newIds = uniq([...filteredUniqueLinks, ...embeddedIds.map(cleanId)])
      // console.log('block ', cid, 'new ids', newIds, filteredUniqueLinks, embeddedIds)
      ret.push(...newIds)
      ret = uniq(ret)
    }
  }
  if (depth === 0) {
    return ret
  }

  const promises = ret.map(async pageId => await getAllPageIds(pageId, depth - 1))
  const linkGroups = await Promise.all(promises)
  return [...ret, ...linkGroups.flat()]
}
