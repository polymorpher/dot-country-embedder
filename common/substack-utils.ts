export const isValidUrlPath = /^\/[/.a-zA-Z0-9-_#]+$/.test

export const getLandingPagePath = (path: string) => {
  const url = new URL(path)
  return url.pathname === '/' ? url.origin : null
}
