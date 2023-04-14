import React from 'react'
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom'
import Notion from './Notion'

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route render={() => <Notion />} />
      </Switch>
    </BrowserRouter>
  )
}

export default Routes
