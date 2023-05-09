import { NotionAPI } from 'notion-client'
import { type Block, type ExtendedRecordMap, type Role } from 'notion-types'
import { JSDOM } from 'jsdom'
import { uniq } from 'lodash-es'
import { type OpenGraphData } from './types.ts'
import {
  extractTitle,
  extractDescription,
  extractPageCover,
  extractPageEmoji,
  makeEmojiDataUrl,
  extractEmoji,
  extractPageImagePreview
} from '../../common/notion-utils.ts'
import { axiosBase } from 'routes/index.ts.ts'
const notion = new NotionAPI()

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

const defaultIcon = `data:image/svg+xml,${encodeURIComponent('<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 180 179.51"><defs><linearGradient id="linear-gradient" x1="202.93" y1="544.7" x2="203.8" y2="545.57" gradientTransform="matrix(180, 0, 0, -179.51, -36456, 98005.23)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00aee9"/><stop offset="1" stop-color="#69fabd"/></linearGradient></defs><title>harmony-one-logo</title><path id="Shape" d="M201.17,60a38.81,38.81,0,0,0-38.84,38.71v42.92c-4,.27-8.09.44-12.33,0.44s-8.31.17-12.33,0.41V98.71a38.84,38.84,0,0,0-77.67,0V201.29a38.84,38.84,0,0,0,77.67,0V158.37c4-.27,8.09-0.44,12.33-0.44s8.31-.17,12.33-0.41v43.77a38.84,38.84,0,0,0,77.67,0V98.71A38.81,38.81,0,0,0,201.17,60ZM98.83,75.86a22.91,22.91,0,0,1,22.92,22.85v45.45a130.64,130.64,0,0,0-33,9.33,60,60,0,0,0-12.8,7.64V98.71A22.91,22.91,0,0,1,98.83,75.86Zm22.92,125.43a22.92,22.92,0,1,1-45.84,0V191c0-9.09,7.2-17.7,19.27-23.06a113,113,0,0,1,26.57-7.77v41.12Zm79.42,22.85a22.91,22.91,0,0,1-22.92-22.85V155.84a130.64,130.64,0,0,0,33-9.33,60,60,0,0,0,12.8-7.64v62.42A22.91,22.91,0,0,1,201.17,224.14ZM204.82,132a113,113,0,0,1-26.57,7.77V98.71a22.92,22.92,0,1,1,45.84,0V109C224.09,118.05,216.89,126.66,204.82,132Z" transform="translate(-60 -60)" style="fill:url(#linear-gradient)"/></svg>')}`
export function getOGDataFromPage (page: ExtendedRecordMap): OpenGraphData {
  const blocks = Object.values(page.block)
  const title = extractTitle(blocks)
  const desc = extractDescription(page)
  const image = extractPageImagePreview(page)
  const emoji = (extractPageEmoji(blocks) ?? extractEmoji(title)) || extractEmoji(desc)
  return {
    title,
    desc,
    icon: emoji ? makeEmojiDataUrl(emoji) : defaultIcon,
    image
  }
}
