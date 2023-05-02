
export const getSld = (): string => {
  if (!window) {
    return ''
  }
  const host = window.location.host
  const parts = host.split('.')
  if (parts.length <= 1) {
    return ''
  }
  return parts[parts.length - 2]
}

export const getPath = (): string => {
  if (!window) {
    return ''
  }
  return window.location.pathname
}

const HexRegex = /[0-9a-f]+/
export const isValidNotionPageId = (id: string): boolean => {
  if (id.length !== 32) {
    return false
  }
  if (!id.match(HexRegex)) {
    return false
  }
  return true
}
