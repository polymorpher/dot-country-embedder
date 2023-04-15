import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Notion from './Notion'
import Manage from './Manage'

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={'/manage'} element={ <Manage />} />
        <Route path='/*' element={ <Notion />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
