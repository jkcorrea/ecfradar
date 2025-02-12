import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseConnectionString(connectionString: string) {
  try {
    const url = new URL(connectionString)

    return {
      host: url.hostname,
      port: Number.parseInt(url.port || '5432'),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
    }
  } catch (error) {
    throw new Error('Invalid connection string format')
  }
}

export const ecfrLink = (title: number, chapter?: string, subchapter?: number) => {
  const base = `https://www.ecfr.gov/current/title-${title.toString()}`
  if (!chapter) return base

  const withChapter = `${base}/chapter-${chapter.toString()}`
  if (!subchapter) return withChapter

  return `${withChapter}/subchapter-${subchapter.toString()}`
}
