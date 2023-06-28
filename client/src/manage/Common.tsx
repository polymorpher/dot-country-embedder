import { FlexColumn, Main } from '../components/Layout'
import { BaseText, SmallText } from '../components/Text'
import { Input, LinkWrarpper } from '../components/Controls'
import config from '../../config'
import React from 'react'
import styled from 'styled-components'
export interface SuccessWithExplorerLinkParameters {
  message: string
  txHash: string
}

export const SuccessWithExplorerLink = ({ message, txHash }: SuccessWithExplorerLinkParameters): JSX.Element => {
  return <FlexColumn style={{ gap: 8 }}>
    <BaseText>{message}</BaseText>
    <LinkWrarpper target='_blank' href={config.explorer(txHash)}>
      <BaseText>View transaction</BaseText>
    </LinkWrarpper>
  </FlexColumn>
}

export const Container = styled(Main)`
  margin: 0 auto;
  padding: 0 16px;
  max-width: 800px;
  // TODO: responsive
`

export const SmallTextGrey = styled(SmallText)`
  color: grey;
`

export const SmallTextRed = styled(SmallText)`
  color: indianred;
`

export const SmallTextGreen = styled(SmallText)`
  color: limegreen;
`

export const InputBox = styled(Input)`
  border-bottom: none;
  font-size: 16px;
  margin: 0;
  background: #e0e0e0;
  &:hover{
    border-bottom: none;
  }
`

export const LabelText = styled(BaseText)`
  white-space: nowrap;
`
