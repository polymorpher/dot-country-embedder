import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Notion from './Notion'
import { Loading } from './components/Misc'
// import Manage from './Manage'
const Manage = lazy(async () => await import('./Manage'))

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/manage'} element={
          <Suspense fallback={<Loading/>}><Manage /></Suspense>} />
        <Route path='/*' element={ <Notion />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
