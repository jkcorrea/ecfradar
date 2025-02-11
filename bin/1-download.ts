import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import { z } from 'zod'

import {
  type Title,
  type TitleMetadata,
  TitleSchema,
  type TitleVersion,
  TitleVersionSchema,
} from '#/lib/schemas'

const dataDir = path.join(__dirname, '..', 'public', 'data', 'latest')

const VersionsResponseSchema = z.object({
  content_versions: z.array(TitleVersionSchema),
})

const TitlesResponseSchema = z.object({
  titles: z.array(TitleSchema),
})

// Parse command line arguments
const forceDownload = process.argv.includes('-f') || process.argv.includes('--force')

async function fetchTitles(): Promise<Title[]> {
  const response = await fetch('https://www.ecfr.gov/api/versioner/v1/titles.json')
  if (!response.ok) throw new Error(`Failed to fetch titles: ${response.statusText}`)
  return TitlesResponseSchema.parse(await response.json()).titles
}

async function fetchTitleRevisions(titleNum: number): Promise<TitleVersion[]> {
  const url = `https://www.ecfr.gov/api/versioner/v1/versions/title-${titleNum}.json`

  console.log(`Fetching revisions for title ${titleNum}...`)
  const response = await fetch(url)
  if (!response.ok)
    throw new Error(
      `Failed to fetch revisions for title ${titleNum}: ${response.statusText}\n${url}`,
    )

  return VersionsResponseSchema.parse(await response.json()).content_versions
}

async function downloadTitle(title: Title) {
  const titleNum = title.number.toString().padStart(2, '0')
  const date = title.latest_issue_date
  const url = `https://www.ecfr.gov/api/versioner/v1/full/${date}/title-${titleNum}.xml`
  const outputPath = path.join(dataDir, `title-${titleNum}.xml`)

  // Skip if file exists and force flag is not set
  if (!forceDownload && existsSync(outputPath)) {
    console.log(
      `Skipping download of title ${titleNum} - file already exists (use -f to force download)`,
    )
    return
  }

  console.log(`Downloading title ${titleNum} from ${url}...`)

  const response = await fetch(url)
  if (!response.ok)
    throw new Error(`Failed to download title ${titleNum}: ${response.statusText}\n${url}`)

  const xml = await response.text()
  await mkdir(dataDir, { recursive: true })
  await Bun.write(outputPath, xml)

  console.log(`Downloaded title ${titleNum} to ${outputPath}`)
}

async function main() {
  try {
    // Fetch all titles
    console.log('Fetching titles...')
    const titles = await fetchTitles()
    console.log(`Found ${titles.length} titles`)

    // Create array to store titles with revisions
    const titlesWithRevisions: TitleMetadata[] = []

    // Download each title and fetch its revisions
    console.log(
      `Downloading titles and fetching revisions${forceDownload ? ' (force mode)' : ''}...`,
    )
    for (const title of titles) {
      // WARN: Skip title 35 because it's currently reserved
      if (title.reserved) continue

      await downloadTitle(title)

      // Fetch revisions for this title
      const revisionsPath = path.join(
        dataDir,
        `title-${title.number.toString().padStart(2, '0')}-versions.json`,
      )
      if (forceDownload || !existsSync(revisionsPath)) {
        const revisions = await fetchTitleRevisions(title.number)
        await Bun.write(revisionsPath, JSON.stringify(revisions, null, 2))
      }

      const titlePath = `/data/latest/title-${title.number.toString().padStart(2, '0')}`
      titlesWithRevisions.push({
        ...title,
        xml: `${titlePath}.xml`,
        markdown: `${titlePath}.md`,
        summary: `${titlePath}.txt`,
        versions: `${titlePath}-versions.json`,
      })

      // Add small delay between requests to be nice to the API
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Save the combined titles data
    const titlesOutputPath = path.join(dataDir, 'titles.json')
    await Bun.write(titlesOutputPath, JSON.stringify(titlesWithRevisions, null, 2))
    console.log(`Saved combined titles data to ${titlesOutputPath}`)

    console.log('Done!')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
