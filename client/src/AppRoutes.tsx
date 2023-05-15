import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Notion from './Notion'
import Substack from './Substack'
import Manage from './Manage'
import config from '../config'

const notion = config.embedPlatform === 'notion'

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/manage'} element={ <Manage />} />
        <Route path='/*' element={ notion ? <Notion /> : <Substack /> } />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
