import './app.scss'
import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRoutes from './AppRoutes'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const container = document.getElementById('root')

if (container != null) {
  const root = createRoot(container)
  root.render(
    <>
      <AppRoutes/>
      <ToastContainer position='top-left'/>
    </>)
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    registration.unregister().catch(console.error)
    if (caches) {
      // Service worker cache should be cleared with caches.delete()
      caches.keys().then(async (names) => {
        await Promise.all(names.map(async name => await caches.delete(name)))
      }).catch(console.error)
    }
  }).catch(console.error)
}
