import fs from 'node:fs'
import path from 'node:path'

import { GoogleGenerativeAI } from '@google/generative-ai'

import type { TitleMetadata, TitleSummary, TitleVersion } from '#/lib/schemas'

const dataDir = path.join(import.meta.dir, '..', 'public', 'data')

const aiSummaryFlag = process.argv.includes('--ai') || process.argv.includes('-A')

if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const MAX_RETRIES = 3
const BASE_DELAY = 1000 // Base delay in milliseconds

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      lastError = error as Error
      if (
        (error as Error).message?.includes('429') ||
        (error as Error).message?.includes('quota')
      ) {
        const delay = 2 ** attempt * BASE_DELAY // Exponential backoff: 1s, 2s, 4s
        console.log(
          `Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      throw error // Re-throw if it's not a rate limit error
    }
  }

  throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`)
}

async function getWordCount(markdown: string): Promise<number> {
  // Remove markdown formatting and other non-content characters
  const cleanText = markdown
    .replace(/[#*`_\[\]()]/g, '') // Remove markdown syntax
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  return cleanText.split(' ').length
}

async function summarizeWithAI(text: string): Promise<string> {
  if (!genAI) throw new Error('Gemini AI client not initialized')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite-preview-02-05' })

  const prompt = `Summarize the following Code of Federal Regulations title. Focus on the main topics covered and key regulatory areas. Keep the summary concise (2-3 paragraphs):

${text.slice(0, 700_000)}` // ~1mil tokens

  const result = await withRetry(() => model.generateContent(prompt))
  return result.response.text()
}

async function processTitle(titleMetadata: TitleMetadata): Promise<TitleSummary> {
  console.log(`Processing title ${titleMetadata.number}...`)

  // Read markdown content
  const mdPath = path.join(dataDir, 'latest', path.basename(titleMetadata.markdown))
  const markdown = fs.readFileSync(mdPath, 'utf-8')

  // Get word count
  const wordCount = await getWordCount(markdown)

  // Get AI summary only if flag is set and no existing summary
  const paddedNum = titleMetadata.number.toString().padStart(2, '0')
  let summary: string | undefined = undefined

  // First check if there's a legacy summary file
  const summaryPath = path.join(dataDir, 'latest', `title-${paddedNum}-summary.txt`)
  if (fs.existsSync(summaryPath)) {
    console.log(`Reading existing summary file for title ${titleMetadata.number}...`)
    summary = fs.readFileSync(summaryPath, 'utf-8')
  } else if (aiSummaryFlag) {
    // If no file exists and AI flag is set, generate a new summary
    console.log(`Summarizing title ${titleMetadata.number} with AI...`)
    summary = await summarizeWithAI(markdown)

    // Write to file for backwards compatibility
    await Bun.write(summaryPath, summary)
    console.log(`Saved summary file for title ${titleMetadata.number}`)
  } else {
    console.log(`Skipping title ${titleMetadata.number} because --ai flag is not set`)
  }

  // Read and process versions
  const versionsPath = path.join(dataDir, 'latest', path.basename(titleMetadata.versions))
  const versions: TitleVersion[] = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'))

  // Group revisions by date
  const revisionsByDate = versions.reduce(
    (acc, { date, substantive }) => {
      if (!acc[date]) {
        acc[date] = { date, substantive, count: 1 }
      } else {
        acc[date].count = (acc[date].count ?? 0) + 1
        // Mark the whole group substantive if any revision is substantive
        acc[date].substantive = acc[date].substantive || substantive
      }
      return acc
    },
    {} as Record<string, TitleSummary['revisions'][number]>,
  )

  return {
    ...titleMetadata,
    wordCount,
    summary,
    revisions: Object.values(revisionsByDate),
  }
}

async function main() {
  try {
    // Read titles metadata
    const titlesPath = path.join(dataDir, 'latest', 'titles.json')
    const titles: TitleMetadata[] = JSON.parse(fs.readFileSync(titlesPath, 'utf-8'))

    console.log('Processing titles...')

    const summaryPath = path.join(dataDir, 'summary.json')
    let summaries: TitleSummary[] = []

    // Load existing summaries if they exist
    if (fs.existsSync(summaryPath)) {
      console.log('Found existing summaries, will merge with new data')
      summaries = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'))
    }

    for (const title of titles) {
      try {
        // Skip if we already have this title's data and it hasn't changed
        const existingSummary = summaries.find((s) => s.number === title.number)
        if (existingSummary?.markdown === title.markdown && !aiSummaryFlag) {
          console.log(`Skipping title ${title.number} - already processed`)
          continue
        }

        // Process the title
        console.log(`Processing title ${title.number}...`)
        const summary = await processTitle(title)

        // Update or add the summary
        const index = summaries.findIndex((s) => s.number === title.number)
        if (index !== -1) {
          summaries[index] = {
            ...summaries[index],
            ...summary,
          }
        } else {
          summaries.push(summary)
        }

        // Save progress after each title
        await Bun.write(summaryPath, JSON.stringify(summaries, null, 2))
        console.log(`Saved progress for title ${title.number}`)
      } catch (err) {
        console.error(`Error processing title ${title.number}:`, err)
      }
    }

    console.log('Finished processing all titles')
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
}

main()
