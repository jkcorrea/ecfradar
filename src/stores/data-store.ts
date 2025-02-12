import { atomWithQuery } from 'jotai-tanstack-query'

import { fetchCompressedJson, isCompressionSupported } from '#/lib/compression'
import { AgenciesSchema, TitleSummarySchema } from '#/lib/schemas'

export const agenciesAtom = atomWithQuery(() => ({
  queryKey: ['agencies'],
  queryFn: async () => {
    const data = await fetchData('/data/agencies.json')

    return AgenciesSchema.parse(data).agencies
  },
}))

export const titlesSummaryAtom = atomWithQuery(() => ({
  queryKey: ['titles-summary'],
  queryFn: async () => {
    const data = await fetchData('/data/summary.json')

    return TitleSummarySchema.array().parse(data)
  },
}))

async function fetchData<T>(path: string): Promise<T> {
  try {
    // Try to fetch compressed version if supported
    if (isCompressionSupported()) {
      return await fetchCompressedJson<T>(`${path}.gz`)
    }
  } catch (error) {
    console.warn('Failed to fetch compressed data, falling back to uncompressed', error)
  }

  // Fallback to uncompressed
  const response = await fetch(path)
  return response.json()
}
