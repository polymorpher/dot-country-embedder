import { getSubdomain as _getSubdomain, getSld as _getSld } from '../../common/domain-utils'
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
