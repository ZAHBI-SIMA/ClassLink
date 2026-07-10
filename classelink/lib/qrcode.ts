import QRCode from 'qrcode'

/** Génère un QR code (data URL PNG) pour la carte d'élève numérique. */
export async function generateStudentQrCode(studentNumber: string): Promise<string> {
  return QRCode.toDataURL(studentNumber, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 300,
    color: { dark: '#1800ad', light: '#ffffff' },
  })
}
