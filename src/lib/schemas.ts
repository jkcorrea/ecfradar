import { z } from 'zod'

const CFRReferenceSchema = z.object({
  title: z.number(),
  chapter: z.string().nullish(),
})
export type CFRReference = z.infer<typeof CFRReferenceSchema>

const AgencyNodeSchema = z.object({
  name: z.string(),
  short_name: z.string().nullish(),
  display_name: z.string(),
  sortable_name: z.string(),
  slug: z.string(),
  cfr_references: z.array(CFRReferenceSchema),
})
export type AgencyNode = z.infer<typeof AgencyNodeSchema>
export const AgencySchema = AgencyNodeSchema.extend({
  children: z.array(AgencyNodeSchema),
})
export type Agency = z.infer<typeof AgencySchema>

export const AgenciesSchema = z.object({
  agencies: z.array(AgencySchema),
})
export type Agencies = z.infer<typeof AgenciesSchema>

export const TitleVersionSchema = z.object({
  date: z.string(),
  amendment_date: z.string(),
  issue_date: z.string(),
  identifier: z.string(),
  name: z.string(),
  part: z.string().nullable(),
  substantive: z.boolean(),
  removed: z.boolean(),
  subpart: z.string().nullable(),
  title: z.string(),
  type: z.string(),
})
export type TitleVersion = z.infer<typeof TitleVersionSchema>

export const TitleSchema = z.object({
  number: z.number(),
  name: z.string(),
  latest_amended_on: z.string().nullable(),
  latest_issue_date: z.string().nullable(),
  up_to_date_as_of: z.string().nullable(),
  reserved: z.boolean(),
})
export type Title = z.infer<typeof TitleSchema>

export const TitleMetadataSchema = TitleSchema.extend({
  xml: z.string(),
  markdown: z.string(),
  summary: z.string(),
  versions: z.string(),
})
export type TitleMetadata = z.infer<typeof TitleMetadataSchema>

export const TitleSummarySchema = TitleMetadataSchema.extend({
  summary: z.string().nullish(),
  wordCount: z.number(),
  revisions: z.array(
    z.object({
      date: z.string(),
      substantive: z.boolean(),
      count: z.number(),
    }),
  ),
})
export type TitleSummary = z.infer<typeof TitleSummarySchema>
