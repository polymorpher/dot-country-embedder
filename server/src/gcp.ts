import { Storage } from '@google-cloud/storage/build/esm/src'
import config from '../config.ts'

const storage = new Storage()
export const uploadFile = async (buffer, filename, bucketName = config.google.storage.bucket): Promise<any> => {
  // Upload the buffer to the Google Storage bucket
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)
  return await new Promise((resolve, reject) => {
    const stream = file.createWriteStream({ resumable: false })
    stream.on('error', reject)
    stream.on('finish', resolve)
    stream.end(buffer)
  })
}

export const fileExist = async (filename, bucketName = config.google.storage.bucket): Promise<boolean> => {
  const bucket = storage.bucket(bucketName)
  const file = bucket.file(filename)
  const [exist] = await file.exists()
  return exist
}

export const getMapUrl = (location?: string, suffix?: string): string => {
  location = location ?? config.google.map.defaultLocation
  suffix = suffix ?? config.google.map.defaultLocationSuffix
  const url = new URL('https://maps.googleapis.com/maps/api/staticmap')
  url.searchParams.append('center', `${location}${suffix}`)
  url.searchParams.append('zoom', '13')
  url.searchParams.append('size', '978x512')
  url.searchParams.append('key', config.google.map.key)
  url.searchParams.append('markers', `${location}${suffix}`)
  url.searchParams.append('style', 'feature:all|saturation:0|hue:0xe7ecf0')
  url.searchParams.append('style', 'feature:road|saturation:-70')
  url.searchParams.append('style', 'feature:feature:poi|visibility:off')
  url.searchParams.append('style', 'feature:road|saturation:-70')
  url.searchParams.append('style', 'feature:road|saturation:-70')
  return url.toString()
}
