import React, { useEffect, useState } from 'react'
import Notion from './Notion'
import Substack from './Substack'
import { buildClient, EWSTypes } from '../api'
import { getSld, getSubdomain } from '../utils'
import { Loading } from '../components/Misc'
import './manage.scss'

const client = buildClient()

const Manage = (): JSX.Element => {
  const [platform, setPlatform] = useState<string>('notion')
  const [ewsType, setEwsType] = useState<number>()
  const sld = getSld()
  const subdomain = getSubdomain()

  useEffect(() => {
    client
      .getEwsType(sld, subdomain)
      .then(e => { setEwsType(e) })
      .catch(console.error)
  }, [sld, subdomain])

  if (ewsType === undefined) {
    return <Loading />
  }

  if (ewsType === EWSTypes.EWS_NOTION) {
    return <Notion />
  }

  if (ewsType === EWSTypes.EWS_SUBSTACK) {
    return <Substack />
  }

  return (
    <label>
      Select platform:
      <select defaultValue={platform} onChange={e => { setPlatform(e.target.value) }}>
        <option value='notion'>Notion</option>
        <option value='substack'>Substack</option>
      </select>
    </label>
  )
}

export default Manage
