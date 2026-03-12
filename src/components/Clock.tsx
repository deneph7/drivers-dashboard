'use client'

import { useEffect, useState } from 'react'

export function Clock() {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const update = () => {
      setDisplay(
        new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date())
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <time className="text-sm font-mono text-gray-600 tabular-nums">
      {display || '\u00a0'}
    </time>
  )
}
