import { getPage, getAllPageIds } from '../src/notion.ts'

async function main (): Promise<void> {
  // const ret = await getPage('f9bd34308dc44b32bb23923318da498c')
  // console.log(JSON.stringify(ret))
  const ret = await getAllPageIds('ae42787a7d774e3bb86dcd897f720a0b', 2)
  // const ret = await getAllPageIds('26e40e9d33ab436eab4533c45ccd6d6c', 1)
  console.log(ret)
}

main().catch(err => { console.error(err) })
