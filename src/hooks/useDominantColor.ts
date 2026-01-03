import { useState, useEffect } from 'react'
import ColorThief from 'colorthief'

export function useDominantColor(imageUrl: string) {
  const [color, setColor] = useState<string | null>(null)

  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      try {
        const colorThief = new ColorThief()
        const result = colorThief.getColor(img)
        if (result) {
          setColor(`rgb(${result[0]}, ${result[1]}, ${result[2]})`)
        }
      } catch (error) {
        console.error('Error extracting color:', error)
      }
    }
  }, [imageUrl])

  return color
}
