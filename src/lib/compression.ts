/**
 * Fetches and decompresses a gzipped JSON file
 * @param url URL of the compressed file
 * @returns Decompressed JSON data
 */
export async function fetchCompressedJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  const blob = await response.blob()

  // Create a DecompressionStream for gzip
  const ds = new DecompressionStream('gzip')
  const decompressedStream = blob.stream().pipeThrough(ds)
  const decompressedBlob = await new Response(decompressedStream).blob()
  const text = await decompressedBlob.text()

  return JSON.parse(text)
}

/**
 * Check if the browser supports compression streams
 */
export function isCompressionSupported(): boolean {
  return (
    import.meta.env.PROD &&
    typeof CompressionStream !== 'undefined' &&
    typeof DecompressionStream !== 'undefined'
  )
}
