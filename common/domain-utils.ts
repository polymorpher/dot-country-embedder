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
    }
    const target = specialDomainTargetMap[hostname + '.' + tld]
    if(target){
        sld = target.slice(0, target.length - '.country'.length)
    }
    return sld
}

export function getSubdomain (hostname: string | string[] ) : string {
    const parts = hostname instanceof Array ? hostname : hostname.split('.')
    let subdomain = parts.length <= 2 ? '' : parts[parts.length - 3].toLowerCase()
    return subdomain
}
