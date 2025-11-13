import { nativeImage, Tray } from 'electron'

let tray: Tray | null = null

export function setupMenuBarProgress() {
  if (process.platform !== 'darwin') return
  if (tray) return // Already created
  tray = new Tray(nativeImage.createEmpty())
  tray.setToolTip('Fast Classifieds')
  tray.setTitle('Idle')
}

export function updateMenuBarProgress(percent: number | null) {
  if (process.platform !== 'darwin' || !tray) return
  if (percent === null) {
    tray.setTitle('Idle')
    return
  }
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  tray.setTitle(`Scraping: ${pct}%`)
}

export function destroyMenuBarProgress() {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
