import React from 'react'
import { BaseText, SmallText } from './Text'

export const Feedback: React.FC = () => {
  return (<SmallText style={{ marginTop: 16 }}>
    Bugs or suggestions?
    Please create an issue on <a href='https://github.com/harmony-one/eas' target='_blank' rel='noreferrer'>GitHub</a>
  </SmallText>)
}
