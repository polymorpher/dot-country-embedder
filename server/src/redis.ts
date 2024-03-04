import { createClient } from 'redis'
import config from '../config.ts'
export { commandOptions } from 'redis'

export const redisClient = createClient({ url: config.redis.url })

export const initRedis = async (): Promise<boolean> => {
  if (!redisClient.isReady) {
    console.log(`Connecting redis to ${config.redis.url}`)
    await redisClient.connect()
  }
  return redisClient.isReady
}

export const testRedis = async (): Promise<void> => {
  const testRes = await redisClient.keys('*')
  console.log(testRes)
}
