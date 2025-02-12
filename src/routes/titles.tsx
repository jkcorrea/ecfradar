import React from 'react'

import { createFileRoute } from '@tanstack/react-router'
import * as Icons from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { ecfrLink } from '#/lib/utils'
import { titlesSummaryAtom } from '#/stores'

export const Route = createFileRoute('/titles')({
  loader: ({ context }) => {
    return { titles: context.store.get(titlesSummaryAtom) }
  },
  component: TitlesPage,
})

function TitlesPage() {
  const { titles } = Route.useLoaderData()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedTitles, setExpandedTitles] = React.useState<Set<number>>(new Set())

  const filteredTitles = React.useMemo(() => {
    if (!titles.data) return []

    const query = searchQuery.toLowerCase()
    return titles.data
      .filter(
        (title) =>
          title.name.toLowerCase().includes(query) ||
          title.summary?.toLowerCase().includes(query) ||
          `Title ${title.number}`.toLowerCase().includes(query),
      )
      .sort((a, b) => a.number - b.number)
  }, [titles.data, searchQuery])

  const toggleExpanded = (titleNumber: number) => {
    setExpandedTitles((prev) => {
      const next = new Set(prev)
      if (next.has(titleNumber)) {
        next.delete(titleNumber)
      } else {
        next.add(titleNumber)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Titles</h1>
        <p className="text-muted-foreground">Browse all CFR titles and their summaries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Titles</CardTitle>
          <CardDescription>{titles.data?.length.toLocaleString()} total titles</CardDescription>
          <Input
            type="search"
            placeholder="Search titles and summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTitles.map((title) => (
              <div key={title.number} className="rounded-lg border p-4">
                <div
                  className="flex cursor-pointer items-center justify-between"
                  onClick={() => toggleExpanded(title.number)}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        Title {title.number} - {title.name}
                      </h3>
                      <a
                        href={ecfrLink(title.number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Icons.ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {title.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  <Icons.ChevronDown
                    className={`h-5 w-5 transform transition-transform ${
                      expandedTitles.has(title.number) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {expandedTitles.has(title.number) && title.summary && (
                  <div className="prose prose-sm mt-4 max-w-none dark:prose-invert">
                    <ReactMarkdown>{title.summary}</ReactMarkdown>
                  </div>
                )}
                {expandedTitles.has(title.number) && !title.summary && (
                  <div className="mt-4 text-sm text-muted-foreground italic">
                    No summary available for this title.
                  </div>
                )}
              </div>
            ))}
            {filteredTitles.length === 0 && (
              <div className="text-center text-muted-foreground">No matching titles found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
