export const segment = (id: string): string[] => {
    if (id.startsWith('https://') || id.startsWith('http://')) {
        const [s1, s2, ...rest] = id.split(':')
        return [s1 + ':' + s2, ...rest]
    }
    return id.split(':')
}

const specialDomains = [
    'blueapes.com',
    'bluetaverse.com',
    'bluetofly.com',
    'harmonyprotocol.com',
    'alsois.one',
    'amazing.one',
    'asthe.one',
    'blueapes.one',
    'blues.one',
    'bluetofly.one',
    'change.one',
    'crazy.one',
    'exchange.one',
    'harmony.one',
    'hungryfoolish.one',
    'incredible.one',
    'inlovewith.one',
    'made.one',
    'madein.one',
    'stse.one',
    'wishing.one',
    'with.one'
]

const specialDomainTargets = specialDomains.map(e=>e.replaceAll('.', '-') + '.country')

// const specialDomainTargetReverseMap = Object.fromEntries(specialDomainTargets.map((e, i)=> [e, specialDomains[i]] ) )
const specialDomainTargetMap = Object.fromEntries(specialDomainTargets.map((e, i)=> [specialDomains[i], e] ) )

export function getSld (hostname: string | string[]) : string {
    const parts = hostname instanceof Array ? hostname : hostname.split('.')
    const tld = parts[parts.length - 1]
    let sld = parts.length <= 1 ? '' : parts[parts.length - 2].toLowerCase()
    if(sld === 'harmony'){
        sld = 'harmony-mirror'
    } else {
        const target = specialDomainTargetMap[hostname + '.' + tld]
        if (target) {
            sld = target.slice(0, target.length - '.country'.length)
        }
    }
    return sld
}

export function getSubdomain (hostname: string | string[] ) : string {
    const parts = hostname instanceof Array ? hostname : hostname.split('.')
    let subdomain = parts.length <= 2 ? '' : parts[parts.length - 3].toLowerCase()
    return subdomain
}

export const parseSettings = (setting: string): PageSetting => {
    setting = setting.replaceAll('https://', 'https%3A%2F%2F').replaceAll('http://', 'http%3A%2F%2F')
    const [landingPageEncoded, mode, ...extensions] = segment(setting)
    const landingPage = decodeURIComponent(landingPageEncoded)
    const unrestrictedMode = mode !== 'strict'
    const farcastEnabled = extensions.includes('farcast')
    const farcastText = extensions.includes('farcast-text')
    const farcastDefaultTokenName = extensions.find(e => e.startsWith('farcast-default-token-name='))?.substring('farcast-default-token-name='.length)
    const farcastMintCustomToken = extensions.find(e => e.startsWith('farcast-custom-mint='))?.substring('farcast-custom-mint='.length)
    let farcastMap = extensions.find(e => e.startsWith('farcast-map='))?.substring('farcast-map='.length)
    if (farcastMap){
        farcastMap = decodeURIComponent(farcastMap)
    }
    return {
        landingPage,
        unrestrictedMode,
        farcastEnabled,
        farcastMintCustomToken: farcastMintCustomToken ? decodeURIComponent(farcastMintCustomToken) : undefined,
        farcastDefaultTokenName: farcastDefaultTokenName? decodeURIComponent(farcastDefaultTokenName) : undefined,
        extensions,
        farcastMap,
        farcastText
    }
}

export const serializeSettings = (setting: PageSetting) =>{
    //TODO
}

export interface PageSetting {
    landingPage: string
    unrestrictedMode: boolean
    farcastEnabled: boolean
    farcastText: boolean
    farcastDefaultTokenName?: string
    farcastMintCustomToken?: string
    farcastMap?: string
    extensions: string[]
}
