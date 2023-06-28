import React from 'react'
import { BaseText, SmallText } from './Text'
import { TailSpin } from 'react-loading-icons'
import { FlexRow, Main } from './Layout'

export const Feedback: React.FC = () => {
  return (<SmallText style={{ marginTop: 16 }}>
    Bugs or suggestions?
    Please create an issue on <a href='https://github.com/harmony-one/dot-country-embedder' target='_blank' rel='noreferrer'>GitHub</a>
  </SmallText>)
}

export const Loading = ({ size = 16 }: { size?: number }): JSX.Element => {
  return <TailSpin stroke='grey' width={size} height={size} />
}

export const LoadingScreen = ({ children, containerStyle }: { children?: JSX.Element | JSX.Element[], containerStyle?: any }): JSX.Element => {
  return <Main style={{ justifyContent: 'center', ...containerStyle }}>
    <FlexRow>
      <Loading size={64}/>
    </FlexRow>
    {children}
  </Main>
}

export const BlankPage = ({ children }: { children?: JSX.Element | JSX.Element[] }): JSX.Element => {
  return <Main style={{ justifyContent: 'center' }}>
    <FlexRow>
      {children}
    </FlexRow>
  </Main>
}
