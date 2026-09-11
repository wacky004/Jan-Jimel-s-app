import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.split(',')[1] || '')
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function shareFile({ blob, filename, mimeType = 'application/pdf', title, text }) {
  if (Capacitor.isNativePlatform()) {
    const base64 = await blobToBase64(blob)
    const saved = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    })
    await Share.share({
      title: title || filename,
      text: text || 'Quotation from Jan & Jimels Party Needs',
      url: saved.uri,
      dialogTitle: 'Share Quotation',
    })
    return saved.uri
  }

  // Browser fallback (development): download the file
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return null
}

export function isNative() {
  return Capacitor.isNativePlatform()
}
