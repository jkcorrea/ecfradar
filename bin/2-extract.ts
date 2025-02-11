import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { XMLParser } from 'fast-xml-parser'

import { xml2Md } from './xml2md'

const outputDir = path.join(__dirname, '..', 'public', 'data', 'latest')

async function processTitle(filePath: string) {
  const xml = await readFile(filePath, 'utf-8')

  // Configure parser to handle attributes and text nodes
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  })

  // Convert XML to markdown
  const parsed = parser.parse(xml)
  const markdown = await xml2Md(xml)

  // Write markdown to file
  const mdFileName = `title-${parsed.ECFR.DIV1}.md`
  const mdPath = path.join(outputDir, mdFileName)
  await Bun.write(mdPath, markdown)
}

async function main() {
  try {
    const files = await readdir(outputDir)
    const xmlFiles = files.filter((f) => f.endsWith('.xml'))

    console.log(`Processing ${xmlFiles.length} title files...`)

    for (const file of xmlFiles) {
      const filePath = path.join(outputDir, file)
      console.log(`Processing ${file}...`)
      await processTitle(filePath)
    }

    console.log('Done!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
