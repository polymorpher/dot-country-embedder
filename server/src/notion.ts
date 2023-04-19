import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import axios from 'axios'
import { JSDOM } from 'jsdom'
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
