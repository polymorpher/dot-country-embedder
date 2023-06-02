import { getSubdomain as _getSubdomain, getSld as _getSld } from '../../common/domain-utils'
import { type ExtendedRecordMap } from 'notion-types'
import { urlNormalize } from '../../common/notion-utils'
export const getSld = (): string => {
  if (!window) {
    return ''
  }
  return _getSld(window.location.host)
}

export const getSubdomain = (): string => {
  if (!window) {
    return ''
  }
  return _getSubdomain(window.location.host)
}

export const getPath = (): string => {
  if (!window) {
    return ''
  }
  return window.location.pathname
}

export const titleEmbeddedMapPageUrl = (rootId: string, blockMap: ExtendedRecordMap) => {
  return (pageId: string) => {
    const shortPageId = (pageId || '').replace(/-/g, '')
    // console.log({ pageId, rootId })
    if (shortPageId === rootId) {
      // console.log('match', { pageId, rootId })
      return '/'
    }
    const title = blockMap.block[pageId]?.value.properties?.title?.flat().join(' ')
    if (!title) {
      // console.log(`page ${pageId} has no title`)
    }
    const urlPrefix = urlNormalize(title || '')

    return `/${urlPrefix}-${shortPageId}`
  }
}
