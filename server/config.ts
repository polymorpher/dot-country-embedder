import * as dotenv from 'dotenv'
dotenv.config()

const DEBUG = process.env.DEBUG === 'true' || process.env.DEBUG === '1'
const config = {
  TLD: process.env.TLD ?? 'country',
  subdomain: process.env.SUBDOMAIN ?? 'www',
  debug: DEBUG,
  provider: process.env.DEFAULT_RPC ?? 'https://api.harmony.one',
  ewsContract: process.env.EMBEDDER_CONTRACT ?? '',
  verbose: process.env.VERBOSE === 'true' || process.env.VERBOSE === '1',
  https: {
    only: process.env.HTTPS_ONLY === 'true' || process.env.HTTPS_ONLY === '1',
    key: DEBUG ? './certs/test.key' : './certs/privkey.pem',
    cert: DEBUG ? './certs/test.cert' : './certs/fullchain.pem'
  },
  corsOrigins: process.env.CORS ?? '',
  farcast: {
    postUrlSubdomainPrefix: process.env.FC_POST_SUBDOMAIN_PREFIX ?? 'farcast-api',
    postUrlPath: process.env.FC_POST_PATH ?? 'farcast',
  }
}
export default config
