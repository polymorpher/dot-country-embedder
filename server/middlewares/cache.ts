import { type NextFunction, type Request, type Response } from 'express'
import { LRUCache } from 'lru-cache'

const cache = new LRUCache({
  max: 5000,
  maxSize: 50000,
  sizeCalculation: (value, key) => {
    return 1
  },
  ttl: 1000 * 60

})

const abbrv = (s: string | object, len: number = 10): string => {
  let printout = ''

  if (typeof s !== 'string') {
    printout = JSON.stringify(s)
  } else {
    printout = s
  }

  if (printout.length > len) {
    printout = printout.slice(0, len) + '...' + printout.slice(printout.length - 5)
  }

  return printout
}

const cached = (ttl?: number) => (req: Request, res: Response, next: NextFunction): void => {
  const key = `${req.method}|${req.path}|${JSON.stringify(req.query)}|${JSON.stringify(req.body)}`
  const keyContentType = key + '|header|content-type'
  const v = cache.get(key)
  if (v) {
    const contentType = cache.get(keyContentType)
    if (contentType) {
      console.log(`Cache header hit key=[${keyContentType}] value=`, contentType)
      res.header('content-type', contentType as string)
    }
    console.log(`Cache hit key=[${key}] value=`, abbrv(v), typeof v)
    res.send(v)
    return
  } else {
    // @ts-expect-error wrapper
    res.__send = res.send
    res.send = (r) => {
      console.log(`Cache set key=[${key}] value=`, abbrv(r), typeof r)
      cache.set(key, r, { ttl: ttl ?? 60 * 1000 })
      if (res.hasHeader('content-type')) {
        const h = res.getHeader('content-type')
        console.log(`Cache header set key=[${keyContentType}] value=`, h)
        cache.set(keyContentType, h, { ttl: ttl ?? 60 * 1000 })
      }
      // @ts-expect-error wrapper
      return res.__send(r)
    }
  }
  next()
}

export default cached
