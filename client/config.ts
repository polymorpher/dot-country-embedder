const debug = process.env.DEBUG

const config = {
  debug,
  embedderContract: process.env.EMBEDDER_CONTRACT ?? (debug ? '0x9BC52FBcCcde8cEADAEde51a25dBeD489b201e53' : '0x476e14D956dca898C33262aecC81407242f8431A'),
  explorer (txHash: string): string {
    return (process.env.EXPLORER_URL ?? 'https://explorer.harmony.one/#/tx/{{txId}}').replace('{{txId}}', txHash)
  },
  walletConnectId: process.env.WALLET_CONNECT_ID ?? '',
  defaultRpc: process.env.DEFAULT_RPC ?? 'https://api.harmony.one',
  server: process.env.SERVER ?? 'https://1ns-embedder-server.hiddenstate.xyz',
  substackServer: process.env.SUBSTACK_SERVER ?? '',
  titleUrlPrefix: process.env.TITLE_URL_PREFIX ?? '',
  tld: process.env.TLD ?? 'country',
  chainParameters: process.env.CHAIN_PARAMETERS
    ? JSON.parse(process.env.CHAIN_PARAMETERS)
    : {
        chainId: '0x63564C40', // A 0x-prefixed hexadecimal string
        chainName: 'Harmony Mainnet Shard 0',
        nativeCurrency: {
          name: 'ONE',
          symbol: 'ONE',
          decimals: 18
        },
        rpcUrls: ['https://api.harmony.one'],
        blockExplorerUrls: ['https://explorer.harmony.one/']
      }
}

export default config
