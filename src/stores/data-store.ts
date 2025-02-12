import { atomWithQuery } from 'jotai-tanstack-query'

import { getQueryClient } from '#/lib/query-client'
import { AgencySchema, TitleSummarySchema } from '#/lib/schemas'

export const agenciesAtom = atomWithQuery(
  () => ({
    queryKey: ['agencies'],
    queryFn: async () => {
      const data = await fetchData('/data/agencies.json')

      return AgencySchema.array().parse(data)
    },
  }),
  getQueryClient,
)

export const titlesSummaryAtom = atomWithQuery(
  () => ({
    queryKey: ['titles-summary'],
    queryFn: async () => {
      const data = await fetchData('/data/summary.json')

      return TitleSummarySchema.array().parse(data)
    },
  }),
  getQueryClient,
)

async function fetchData<T>(path: string): Promise<T> {
  try {
    // Try to fetch compressed version if supported
    if (import.meta.env.PROD) {
      return await fetchCompressedJson<T>(`${path}.gz`)
    }
  } catch (error) {
    console.warn('Failed to fetch compressed data, falling back to uncompressed', error)
  }

  // Fallback to uncompressed
  const response = await fetch(path)
  return response.json()
}

/**
 * Fetches and decompresses a gzipped JSON file
 * @param url URL of the compressed file
 * @returns Decompressed JSON data
 */
async function fetchCompressedJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const blob = await response.blob()

  // Create a DecompressionStream for gzip
  const ds = new DecompressionStream('gzip')
  const decompressedStream = blob.stream().pipeThrough(ds)
  const decompressedBlob = await new Response(decompressedStream).blob()
  const text = await decompressedBlob.text()

  return JSON.parse(text)
}
