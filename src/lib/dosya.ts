/** Dosyayı base64 data URL olarak okur */
export function dataUrlOku(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Dosya okunamadı"))
    reader.readAsDataURL(file)
  })
}
