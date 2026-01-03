import type { Metadata } from 'next'
import { StreamingLayoutClient } from './StreamingLayoutClient'

export const metadata: Metadata = {
  title: {
    default: 'RPB TV - Streaming Beyblade',
    template: '%s | RPB TV',
  },
  description: 'Regardez tous les animes Beyblade en streaming : Beyblade X, Burst, Metal, et la série originale.',
}

export default function StreamingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StreamingLayoutClient>{children}</StreamingLayoutClient>
}
