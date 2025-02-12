import fs from 'node:fs'
import path from 'node:path'

const distDataDir = path.join(import.meta.dir, '..', 'dist', 'data')

if (!fs.existsSync(distDataDir))
  throw new Error('dist/data directory does not exist, did you run build?')

/**
 * Compresses a file using gzip
 * @param inputPath Path to input file
 * @param outputPath Path to output compressed file
 */
async function compressFile(inputPath: string, outputPath: string): Promise<void> {
  const input = fs.readFileSync(inputPath)
  const compressed = Bun.gzipSync(input)
  fs.writeFileSync(outputPath, compressed)
}

async function main() {
  // Remove all XML files
  for await (const file of new Bun.Glob('**/*.xml').scan({ cwd: distDataDir })) {
    const xmlPath = path.join(distDataDir, file)
    fs.unlinkSync(xmlPath)
    console.log(`Removed ${file}`)
  }

  // Find all JSON and Markdown files in public/data
  const files = []
  for await (const file of new Bun.Glob('**/*.{json,md}').scan({ cwd: distDataDir })) {
    files.push(file)
  }

  console.log(`Found ${files.length} files to compress`)

  for (const file of files) {
    const inputPath = path.join(distDataDir, file)
    const outputPath = `${inputPath}.gz`

    await compressFile(inputPath, outputPath)
    console.log(`Compressed ${file} -> ${file}.gz`)

    // Get compression ratio
    const inputSize = fs.statSync(inputPath).size
    const outputSize = fs.statSync(outputPath).size
    const ratio = ((1 - outputSize / inputSize) * 100).toFixed(1)
    console.log(
      `Compression ratio: ${ratio}% (${(inputSize / 1024 / 1024).toFixed(1)}MB -> ${(outputSize / 1024 / 1024).toFixed(1)}MB)`,
    )

    // Delete the original file
    fs.unlinkSync(inputPath)
  }
}

main().catch(console.error)
