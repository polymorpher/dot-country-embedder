import React, { useEffect, useState } from 'react'
import Notion from './Notion'
import Substack from './Substack'
import { buildClient, EWSTypes } from '../api'
import { getSld, getSubdomain } from '../utils'
import { LoadingScreen } from '../components/Misc'
import { Button } from '../components/Controls'
import styled from 'styled-components'
import './manage.scss'

const client = buildClient()

const Container = styled.div`
  display: flex;
`

const Content = styled.div`
  margin: auto;
`

const PlatformChoice = styled.div`
  display: flex;
  justify-content: space-between;
`

const BackButton = styled(Button)`
  display: block;
  margin: auto;
  margin-top: 1em;
`

const Manage = (): JSX.Element => {
  const [platform, setPlatform] = useState<number>()
  const [ewsType, setEwsType] = useState<number>(0)
  const sld = getSld()
  const subdomain = getSubdomain()

  useEffect(() => {
    client
      .getEwsType(sld, subdomain)
      .then(e => { setEwsType(e) })
      .catch(console.error)
  }, [sld, subdomain])

  if (ewsType === undefined) {
    return <LoadingScreen />
  }

  if (ewsType === EWSTypes.EWS_NOTION) {
    return <Notion />
  }

  if (ewsType === EWSTypes.EWS_SUBSTACK) {
    return <Substack />
  }

  if (platform === EWSTypes.EWS_NOTION) {
    return (
      <>
        <BackButton onClick={() => setPlatform(EWSTypes.EWS_UNKNOWN)}>
          BACK
        </BackButton>
        <Notion />
      </>
    )
  }

  if (platform === EWSTypes.EWS_SUBSTACK) {
    return (
      <>
        <BackButton onClick={() => setPlatform(EWSTypes.EWS_UNKNOWN)}>
          BACK
        </BackButton>
        <Substack />
      </>
    )
  }

  return (
    <Container>
      <Content>
        <p style={{ marginTop: '5em' }}>Which platform would you connect to?</p>
        <PlatformChoice>
          <Button onClick={() => setPlatform(EWSTypes.EWS_NOTION)}>Notion</Button>
          <Button onClick={() => setPlatform(EWSTypes.EWS_SUBSTACK)}>Substack</Button>
        </PlatformChoice>
      </Content>
    </Container>
  )
}

export default Manage
