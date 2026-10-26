/** Fetches a file from the API and saves it through a temporary link. */
export async function downloadFile(url: string, filename: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed (${response.status})`)

  const blobUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}
