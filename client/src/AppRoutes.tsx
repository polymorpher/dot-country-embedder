import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Page from './Page'
import Manage from './Manage'
import config from '../config'

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/manage'} element={ <Manage />} />
        <Route path='/*' element={ <Page notion={config.embedPlatform === 'notion'} /> } />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
