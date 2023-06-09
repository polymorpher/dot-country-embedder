import React, { useState } from 'react'
import Notion from './Notion'
import Substack from './Substack'
import { EWSTypes } from '../api'
import { Button } from '../components/Controls'
import styled from 'styled-components'
import './manage.scss'
import queryString from 'query-string'

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
  margin-top: 32px;
  margin-bottom: 64px;
`

interface ManageProps {
  ewsType: number
}

const Manage = ({ ewsType }: ManageProps): JSX.Element => {
  const [platform, setPlatform] = useState<number>()
  const parsed = queryString.parse(location.search)
  const { t: ewsTypeOverride } = parsed
  ewsType = ewsType ?? ewsTypeOverride

  if (ewsType === EWSTypes.EWS_NOTION) {
    return <Notion />
  }

  if (ewsType === EWSTypes.EWS_SUBSTACK) {
    return <Substack />
  }
  const back = <BackButton onClick={() => { setPlatform(EWSTypes.EWS_UNKNOWN) }}>
    {'<'} BACK
  </BackButton>
  if (platform === EWSTypes.EWS_NOTION) {
    return <Notion footer={back}/>
  }

  if (platform === EWSTypes.EWS_SUBSTACK) {
    return <Substack footer={back} />
  }

  return (
    <Container>
      <Content>
        <p style={{ marginTop: '5em' }}>Which platform would you connect to?</p>
        <PlatformChoice>
          <Button onClick={() => { setPlatform(EWSTypes.EWS_NOTION) }}>Notion</Button>
          <Button onClick={() => { setPlatform(EWSTypes.EWS_SUBSTACK) }}>Substack</Button>
        </PlatformChoice>
      </Content>
    </Container>
  )
}

export default Manage
