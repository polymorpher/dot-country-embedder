import React, { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Notion from './Notion'
import Substack from './Substack'
import { Loading, LoadingScreen } from './components/Misc'
import { buildClient, EWSTypes } from './api'
import { getSld, getSubdomain } from './utils'
const Manage = lazy(async () => await import('./manage'))

const client = buildClient()
const sld = getSld()
const subdomain = getSubdomain()

const AppRoutes: React.FC = () => {
  const [ewsType, setEwsType] = useState<number>()

  useEffect(() => {
    client.getEwsType(sld, subdomain)
      .then(e => { setEwsType(e) })
      .catch(console.error)
  }, [])

  if (ewsType === undefined) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/manage'} element={
          <Suspense fallback={<Loading/>}>
            <Manage ewsType={ewsType} />
          </Suspense>} />
        <Route
          path='/*'
          element={
            ewsType === EWSTypes.EWS_SUBSTACK
              ? <Substack />
              : <Notion />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
