
export const renderMintSuccess = (): string => {
  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-success.png" />
        <meta property="og:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-success.png" />
      </head>
      <body>Hello, bot!</body>
    </html>
`
}

export const renderMintFailed = (restartTarget: string): string => {
  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content="${restartTarget}" />
        <meta property="fc:frame:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-fail.png" />
        <meta property="og:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-fail.png" />
        <meta property="fc:frame:button:1" content="Restart" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:1:target" content="${restartTarget}"/>
        <meta property="fc:frame:input:text" content="Send feedback to us"/>
        
      </head>
      <body>Hello, bot!</body>
    </html>
`
}
