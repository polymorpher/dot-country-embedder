import './app.scss'
import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './AppRoutes'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { WagmiConfig, createClient, configureChains } from 'wagmi'
import { harmonyOne } from '@wagmi/core/chains'
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc'
import config from '../config'
import { InjectedConnector } from 'wagmi/connectors/injected'

const { chains, provider } = configureChains(
  [harmonyOne],
  [jsonRpcProvider({ rpc: () => ({ http: config.defaultRpc }) })]
)

const client = createClient({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  provider
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
