/** Downscale an uploaded image file for lightweight local storage. */
export async function fileToDownscaledDataURL(file: File, maxEdge = 420): Promise<string> {
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not decode the selected image.'))
    image.src = dataURL
  }).catch(() => {
    throw new Error('Could not decode the selected image.')
  })

  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataURL
  ctx.drawImage(img, 0, 0, width, height)
  try {
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch {
    return dataURL
  }
}

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
