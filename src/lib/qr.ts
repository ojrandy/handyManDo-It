import QRCode from 'qrcode'

// Server components only: the QR is rendered at build time so the popover ships no QR
// library to the browser.
export async function qrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#0f2530', light: '#ffffff' },
  })
}
