const substackUrlRegExp = /^https:\/\/[a-zA-Z0-9-]+.substack.com(\/|\/[/.a-zA-Z0-9-_#]+)?$/;

const substackLandingUrlRegExp = /^https:\/\/[a-zA-Z0-9-]+.substack.com(\/?)$/;

export const isValidSubstackLandingUrl = (str: string) => substackLandingUrlRegExp.test(str)

export const isValidSubstackUrl = (str: string) => substackUrlRegExp.test(str)
