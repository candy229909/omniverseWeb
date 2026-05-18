'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { StreamSession } from '@/lib/types'

// The SDK is published to NVIDIA's private npm registry (see `.npmrc`) and
// is loaded at runtime only. We use `new Function('import(...)')` so webpack
// won't try to statically resolve the package at build time — builds work
// even without registry access; the stream only requires the package at
// the moment a user actually clicks "連線".
type AppStreamerType = typeof import('@nvidia/omniverse-webrtc-streaming-library').AppStreamer
type StreamEvent = import('@nvidia/omniverse-webrtc-streaming-library').StreamEvent

const SDK_PACKAGE = '@nvidia/omniverse-webrtc-streaming-library'

async function loadOmniverseSDK(): Promise<typeof import('@nvidia/omniverse-webrtc-streaming-library')> {
  const importer = new Function('p', 'return import(p)') as (p: string) => Promise<typeof import('@nvidia/omniverse-webrtc-streaming-library')>
  return importer(SDK_PACKAGE)
}

type ViewerState = 'idle' | 'connecting' | 'connected' | 'error'

const VIDEO_ID = 'omniverse-remote-video'
const AUDIO_ID = 'omniverse-remote-audio'

export default function WebRTCViewer({
  session,
  onConnected,
  onDisconnected,
}: {
  session: StreamSession
  onConnected?: () => void
  onDisconnected?: () => void
}) {
  const streamerRef = useRef<AppStreamerType | null>(null)
  const stateRef = useRef<ViewerState>('idle')
  const [state, setState] = useState<ViewerState>('idle')
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ bitrate: 0, fps: 0 })
  const [muted, setMuted] = useState(true)

  const updateState = (s: ViewerState) => {
    stateRef.current = s
    setState(s)
  }

  const disconnect = useCallback(() => {
    try {
      streamerRef.current?.stop()
    } catch (e) {
      console.warn('AppStreamer.stop failed', e)
    }
    updateState('idle')
    setStats({ bitrate: 0, fps: 0 })
    onDisconnected?.()
  }, [onDisconnected])

  useEffect(() => {
    return () => {
      try { streamerRef.current?.stop() } catch { /* noop */ }
    }
  }, [])

  const connect = useCallback(async () => {
    setError('')
    updateState('connecting')
    try {
      const mod = await loadOmniverseSDK()
      const AppStreamer = mod.AppStreamer
      streamerRef.current = AppStreamer

      const config = {
        streamType: session.streamType,
        videoElementId: VIDEO_ID,
        audioElementId: AUDIO_ID,
        signalingServer: session.signalingServer,
        signalingPort: session.signalingPort,
        mediaServer: session.mediaServer || session.signalingServer,
        mediaPort: session.mediaPort || session.signalingPort,
        authenticate: false,
        maxReconnects: 10,
        nativeTouchEvents: true,
        width: session.width,
        height: session.height,
        fps: session.fps,
        onStart: (e: StreamEvent) => {
          console.info('[Omniverse] stream started', e)
          updateState('connected')
          onConnected?.()
        },
        onStop: (e: StreamEvent) => {
          console.info('[Omniverse] stream stopped', e)
          if (stateRef.current !== 'idle') disconnect()
        },
        onUpdate: (e: StreamEvent) => {
          // metadata / size updates from the streamed app
          console.debug('[Omniverse] update', e)
        },
        onCustomEvent: (e: StreamEvent) => {
          console.debug('[Omniverse] custom event', e)
        },
      }

      await AppStreamer.connect(config)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Omniverse] connect failed', err)
      setError(`連線失敗：${message}`)
      updateState('error')
    }
  }, [session, disconnect, onConnected])

  // 簡易視訊統計（讀取 <video> 元素的 currentTime / videoWidth 變化作為粗略指標）
  useEffect(() => {
    if (state !== 'connected') return
    const video = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
    if (!video) return
    let lastTime = video.currentTime
    let lastStamp = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const dt = (now - lastStamp) / 1000
      const dframes = Math.max(0, video.currentTime - lastTime)
      const fps = dt > 0 ? Math.round(dframes / dt * (session.fps || 60)) : 0
      lastTime = video.currentTime
      lastStamp = now
      setStats({ bitrate: 0, fps })
    }, 1000)
    return () => clearInterval(id)
  }, [state, session.fps])

  // Mute toggle — control the audio element managed by the SDK.
  useEffect(() => {
    const audio = document.getElementById(AUDIO_ID) as HTMLAudioElement | null
    if (audio) audio.muted = muted
    const video = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
    if (video) video.muted = muted
  }, [muted, state])

  const toggleFullscreen = () => {
    const el = document.getElementById(VIDEO_ID) as HTMLVideoElement | null
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen()
  }

  return (
    <div className="rtc-viewer">
      <div className="rtc-video-wrap">
        {/* AppStreamer attaches the remote MediaStream to these elements by id */}
        <video id={VIDEO_ID} className="rtc-video" autoPlay playsInline muted={muted} tabIndex={-1} />
        <audio id={AUDIO_ID} muted={muted} />
        {state !== 'connected' && (
          <div className="rtc-overlay">
            {state === 'idle' && <div>尚未連線</div>}
            {state === 'connecting' && <div className="rtc-spinner">連線中…</div>}
            {state === 'error' && <div className="rtc-error">⚠ {error}</div>}
          </div>
        )}
      </div>

      <div className="rtc-controls">
        <div className="rtc-status">
          <span className={`rtc-dot rtc-dot-${state}`} />
          <span>{labelOf(state)}</span>
          {state === 'connected' && stats.fps > 0 && (
            <span className="rtc-stats">~{stats.fps} fps</span>
          )}
        </div>
        <div className="rtc-actions">
          {state === 'idle' || state === 'error' ? (
            <button className="btn-primary" onClick={connect}>連線</button>
          ) : (
            <button className="btn-secondary" onClick={disconnect}>中斷</button>
          )}
          <button className="btn-ghost" onClick={() => setMuted((m) => !m)} disabled={state !== 'connected'}>
            {muted ? '🔇 取消靜音' : '🔊 靜音'}
          </button>
          <button className="btn-ghost" onClick={toggleFullscreen} disabled={state !== 'connected'}>
            ⛶ 全螢幕
          </button>
        </div>
      </div>
    </div>
  )
}

function labelOf(s: ViewerState) {
  return ({ idle: '尚未連線', connecting: '連線中…', connected: '已連線', error: '連線錯誤' } as const)[s]
}
