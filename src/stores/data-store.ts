import { atomWithQuery } from 'jotai-tanstack-query'

import { AgenciesSchema, TitleSummarySchema } from '#/lib/schemas'

export const agenciesAtom = atomWithQuery(() => ({
  queryKey: ['agencies'],
  queryFn: async () => {
    const response = await fetch('/data/agencies.json')
    const data = await response.json()

    return AgenciesSchema.parse(data).agencies
  },
}))

export const titlesSummaryAtom = atomWithQuery(() => ({
  queryKey: ['titles-summary'],
  queryFn: async () => {
    const response = await fetch('/data/summary.json')
    const data = await response.json()

    return TitleSummarySchema.array().parse(data)
  },
}))
