export interface OpenGraphData {
  title: string
  desc: string
  url?: string
  icon: string
  image?: string
}

type EWSType = 0 | 1 | 2

export const EWSTypes: Record<string, EWSType> = {
  EWS_UNKNOWN: 0,
  EWS_NOTION: 1,
  EWS_SUBSTACK: 2
}
