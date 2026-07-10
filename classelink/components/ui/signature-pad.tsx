'use client'

import { useRef, useState, useEffect } from 'react'

interface Props {
  onSave: (dataUrl: string) => void
  onCancel?: () => void
  disabled?: boolean
}

/** Zone de signature tactile/souris — capture une signature numérique en PNG (base64). */
export function SignaturePad({ onSave, onCancel, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Redimensionne le canvas à sa taille CSS réelle (évite le flou sur écrans HiDPI)
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width  = rect.width  * ratio
    canvas.height = rect.height * ratio
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0f172a'
  }, [])

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const point = 'touches' in e ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    drawing.current = true
    lastPoint.current = getPoint(e)
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current || disabled) return
    e.preventDefault()
    const ctx = canvasRef.current!.getContext('2d')!
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current!.x, lastPoint.current!.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
    setIsEmpty(false)
  }

  function end() {
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  function save() {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    onSave(canvas.toDataURL('image/png'))
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
        {isEmpty && (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none">
            Signez ici avec la souris ou le doigt
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={clear} disabled={disabled}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50">
          Effacer
        </button>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
          )}
          <button type="button" onClick={save} disabled={disabled || isEmpty}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Valider la signature
          </button>
        </div>
      </div>
    </div>
  )
}
