import { type AxiosError } from 'axios'

export function printError (ex: any): void {
  if (ex?.response) {
    const e = ex as AxiosError
    let data = JSON.stringify(e.response?.data)
    if (data.length > 200) {
      data = data.slice(0, 200) + '...'
    }
    console.error(e.response?.status, e.response?.statusText, e.config?.url, data)
    return
  }
  console.error(ex)
}
