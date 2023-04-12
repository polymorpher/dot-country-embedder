import { getPage } from '../src/notion.ts'

async function main (): Promise<void> {
  const ret = await getPage('f9bd34308dc44b32bb23923318da498c')
  console.log(JSON.stringify(ret))
}

main().catch(err => { console.error(err) })
