export function getSld (hostname: string | string[] ) {
    const parts = hostname instanceof Array ? hostname : hostname.split('.')
    let sld = parts.length <= 1 ? '' : parts[parts.length - 2].toLowerCase()
    if(sld === 'harmony'){
        sld = 'h'
    }
    return sld
}

export function getSubdomain (hostname: string | string[] ) {
    const parts = hostname instanceof Array ? hostname : hostname.split('.')
    let subdomain = parts.length <= 2 ? '' : parts[parts.length - 3].toLowerCase()
    return subdomain
}