import './app.scss'
import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './AppRoutes'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { WagmiConfig, createClient, configureChains, type Chain } from 'wagmi'
import { harmonyOne } from 'wagmi/chains'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import config from '../config'
// import { InjectedConnector } from 'wagmi/connectors/injected'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'

const harmonyOneCustom = {
  ...harmonyOne,
  rpcUrls: {
    default: { http: config.defaultRpc },
    public: { http: config.defaultRpc }
  }
} as unknown as Chain

const { chains, provider, webSocketProvider } = configureChains(
  [harmonyOneCustom],
  [jsonRpcProvider({ rpc: () => ({ http: config.defaultRpc }) })]
)

// console.log(chains)
const client = createClient({
  autoConnect: true,
  connectors: [
    // new InjectedConnector({ chains }),
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: { projectId: config.walletConnectId }
    })
  ],
  provider,
  webSocketProvider
})

const container = document.getElementById('root')

if (container != null) {
  const root = createRoot(container)
  root.render(
    <>
      <WagmiConfig client={client}>
        <AppRoutes/>
      </WagmiConfig>
      <ToastContainer position='top-left'/>
    </>)
}
