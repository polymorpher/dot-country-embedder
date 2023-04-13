import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'

const notion = new NotionAPI()

export async function getPage (id: string): Promise<ExtendedRecordMap> {
  return await notion.getPage(id)
}
