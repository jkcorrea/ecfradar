import { promisify } from 'node:util'

import { parseString } from 'xml2js'

const parseXmlString = promisify(parseString)

interface XmlNode {
  $?: { [key: string]: string }
  _?: string
  N?: string
  TYPE?: string
  VOLUME?: string
  AMDDATE?: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  [key: string]: any
}

class XmlToMarkdownConverter {
  private result: string[] = []

  async convert(xmlString: string): Promise<string> {
    const parsed = (await parseXmlString(xmlString)) as {
      ECFR: XmlNode
    }

    this.processNode(parsed.ECFR)
    return this.result.join('\n\n')
  }

  private processNode(node: XmlNode, depth = 0): void {
    if (!node) return

    // Handle division headers with their numbers and types
    if (this.isDivisionNode(node)) {
      const divType = node.TYPE || ''
      const divNum = node.N || ''
      if (node.HEAD) {
        const headText = typeof node.HEAD === 'string' ? node.HEAD : node.HEAD._ || ''
        // Don't repeat the type and number in the heading text if it's already there
        const cleanHeadText = this.cleanText(headText).replace(`${divType} ${divNum}—`, '')
        const heading = `${'#'.repeat(Math.min(depth + 1, 6))} ${divType} ${divNum}: ${cleanHeadText}`
        this.result.push(heading)
      }
    }

    // Handle metadata sections
    if (node.AUTH) {
      const authText = this.extractTextFromMixedContent(node.AUTH)
      if (authText.trim()) {
        this.result.push('**Authority:**')
        this.result.push(this.cleanText(authText))
      }
    }

    if (node.SOURCE) {
      const sourceText = this.extractTextFromMixedContent(node.SOURCE)
      if (sourceText.trim()) {
        this.result.push('**Source:**')
        this.result.push(this.cleanText(sourceText))
      }
    }

    if (node.AMDDATE) {
      this.result.push(`*Amendment Date: ${this.cleanText(node.AMDDATE)}*`)
    }

    // Handle editorial notes
    if (node.EDNOTE) {
      this.result.push('*Editorial Note:*')
      this.processParagraph(node.EDNOTE)
    }

    // Handle existing cases
    if (node.HEAD && !this.isDivisionNode(node)) {
      const headText = typeof node.HEAD === 'string' ? node.HEAD : node.HEAD._ || ''
      const heading = `${'#'.repeat(Math.min(depth + 1, 6))} ${this.cleanText(headText)}`
      this.result.push(heading)
    }

    // Handle paragraphs and extracts
    if (node.P) {
      if (Array.isArray(node.P)) {
        for (const p of node.P) {
          this.processParagraph(p)
        }
      } else {
        this.processParagraph(node.P)
      }
    }

    if (node.EXTRACT) {
      this.processExtract(node.EXTRACT)
    }

    // Handle formatted paragraphs (usually lists)
    if (node['FP-1']) {
      this.processFormattedParagraph(node['FP-1'])
    }

    // Process tables
    if (node.TABLE) {
      this.processTable(node.TABLE)
    }

    // Recursively process child nodes
    for (const [key, value] of Object.entries(node)) {
      if (key.match(/^DIV\d+$/)) {
        if (Array.isArray(value)) {
          for (const v of value) {
            this.processNode(v, depth + 1)
          }
        } else {
          this.processNode(value, depth + 1)
        }
      }
    }
  }

  private isDivisionNode(node: XmlNode): boolean {
    return node.TYPE !== undefined && node.N !== undefined
  }

  private processExtract(extract: XmlNode | string): void {
    if (typeof extract === 'string') {
      this.result.push(`> ${this.cleanText(extract)}`)
    } else if (extract._) {
      this.result.push(`> ${this.cleanText(extract._)}`)
    } else {
      const text = this.extractTextFromMixedContent(extract)
      if (text) {
        this.result.push(`> ${this.cleanText(text)}`)
      }
    }
  }

  private processFormattedParagraph(fp: XmlNode | string): void {
    // Handle formatted paragraphs as list items
    if (typeof fp === 'string') {
      this.result.push(`- ${this.cleanText(fp)}`)
    } else if (fp._) {
      this.result.push(`- ${this.cleanText(fp._)}`)
    } else {
      const text = this.extractTextFromMixedContent(fp)
      if (text) {
        this.result.push(`- ${this.cleanText(text)}`)
      }
    }
  }

  private extractTextFromMixedContent(node: XmlNode): string {
    let text = ''

    const processContent = (content: any): void => {
      if (typeof content === 'string') {
        text += content
      } else if (content._) {
        text += content._
      } else if (content.HED) {
        // Skip HED tags in metadata sections since we add our own headers
        return
      } else if (content.I) {
        // Handle italics
        text += `*${typeof content.I === 'string' ? content.I : this.extractTextFromMixedContent(content.I)}*`
      } else if (content.B) {
        // Handle bold
        text += `**${typeof content.B === 'string' ? content.B : this.extractTextFromMixedContent(content.B)}**`
      } else if (content.E) {
        // Handle emphasis
        text += `*${typeof content.E === 'string' ? content.E : this.extractTextFromMixedContent(content.E)}*`
      } else if (content.CITA) {
        // Handle citations
        text += ` [${typeof content.CITA === 'string' ? content.CITA : this.extractTextFromMixedContent(content.CITA)}]`
      } else if (content.PSPACE) {
        // Handle paragraph spacing
        text += '\n\n'
      } else if (Array.isArray(content)) {
        content.forEach(processContent)
      } else if (typeof content === 'object') {
        Object.values(content).forEach(processContent)
      }
    }

    processContent(node)
    return text
  }

  private processParagraph(p: XmlNode | string): void {
    if (typeof p === 'string') {
      this.result.push(this.cleanText(p))
    } else if (p._) {
      this.result.push(this.cleanText(p._))
    } else if (typeof p === 'object') {
      // Handle complex paragraphs with mixed content
      const text = this.extractTextFromMixedContent(p)
      if (text) {
        this.result.push(this.cleanText(text))
      }
    }
  }

  private processTable(table: XmlNode): void {
    if (!table.TR) return

    const rows = Array.isArray(table.TR) ? table.TR : [table.TR]
    const markdown: string[] = []

    // Process header row
    if (rows[0]?.TH) {
      const headers = Array.isArray(rows[0].TH) ? rows[0].TH : [rows[0].TH]
      markdown.push(`| ${headers.map((th: any) => this.cleanText(th._ || th)).join(' | ')} |`)
      markdown.push(`| ${headers.map(() => '---').join(' | ')} |`)
    }
    // Process data rows
    for (const row of rows) {
      if (row.TD) {
        const cells = Array.isArray(row.TD) ? row.TD : [row.TD]
        markdown.push(
          `| ${cells
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            .map((td: { _: any }) => this.cleanText(td._ || td))
            .join(' | ')} |`,
        )
      }
    }

    this.result.push(markdown.join('\n'))
  }

  private cleanText(text: string): string {
    if (!text) return ''
    return text
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\n+/g, ' ')
  }
}

// Usage example:
export async function xml2Md(xmlString: string): Promise<string> {
  const converter = new XmlToMarkdownConverter()
  return converter.convert(xmlString)
}
