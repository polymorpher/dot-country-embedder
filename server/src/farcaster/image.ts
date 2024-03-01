export const renderImageResponse = (image: string, text?: string, nextAction?: string, nextTarget?: string): string => {
  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image}" />
        <meta property="og:image" content="${image}" />
        ${text
        ? `
        <meta property="fc:frame:button:1" content="${text}" />
        <meta property="fc:frame:button:1:action" content="${nextAction}" />
        <meta property="fc:frame:button:1:target" content="${nextTarget}"/>
        `
        : ''}
      </head>
      <body>Hello, bot!</body>
    </html>
`
}
