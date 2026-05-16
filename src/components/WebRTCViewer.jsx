import { useCallback, useEffect, useRef, useState } from 'react'

// 訊號伺服器訊息協定。若您的 Omniverse Kit 訊號協定不同，調整此處即可。
const MSG = {
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE: 'ice',
  READY: 'ready',
}

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

function buildSignalingUrl({ host, port, signalingPath, secure }) {
  const proto = secure ? 'wss' : 'ws'
  const path = signalingPath?.startsWith('/') ? signalingPath : `/${signalingPath || ''}`
  return `${proto}://${host}:${port}${path}`
}

export default function WebRTCViewer({ session, onConnected, onDisconnected }) {
  const videoRef = useRef(null)
  const pcRef = useRef(null)
  const wsRef = useRef(null)
  const [state, setState] = useState('idle') // idle | connecting | connected | error
  const [error, setError] = useState('')
  const [stats, setStats] = useState({ bitrate: 0, fps: 0 })
  const [muted, setMuted] = useState(true)

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => s.track?.stop())
      pcRef.current.close()
      pcRef.current = null
    }
    if (wsRef.current) {
      try { wsRef.current.close() } catch { /* noop */ }
      wsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const disconnect = useCallback(() => {
    cleanup()
    setState('idle')
    setStats({ bitrate: 0, fps: 0 })
    onDisconnected?.()
  }, [cleanup, onDisconnected])

  useEffect(() => () => cleanup(), [cleanup])

  const connect = useCallback(async () => {
    setError('')
    setState('connecting')
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: MSG.ICE, candidate: event.candidate }))
        }
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setState('connected')
          onConnected?.()
        } else if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
          if (state !== 'idle') disconnect()
        }
      }

      // 接收影音
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      const url = buildSignalingUrl({
        host: session.host,
        port: session.port,
        signalingPath: session.signalingPath,
        secure: session.secure,
      })

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: MSG.READY, sessionId: session.id }))
      }

      ws.onerror = () => {
        setError(`無法連接訊號伺服器：${url}`)
        setState('error')
      }

      ws.onclose = () => {
        if (state === 'connecting') {
          setError(`訊號伺服器已關閉連線：${url}`)
          setState('error')
        }
      }

      ws.onmessage = async (event) => {
        let msg
        try { msg = JSON.parse(event.data) } catch { return }

        if (msg.type === MSG.OFFER) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.sdp }))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          ws.send(JSON.stringify({ type: MSG.ANSWER, sdp: answer.sdp }))
        } else if (msg.type === MSG.ANSWER) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.sdp }))
        } else if (msg.type === MSG.ICE && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          } catch (e) {
            console.warn('addIceCandidate failed', e)
          }
        }
      }
    } catch (err) {
      setError(err.message)
      setState('error')
      cleanup()
    }
  }, [session, state, cleanup, disconnect, onConnected])

  // 簡易統計
  useEffect(() => {
    if (state !== 'connected' || !pcRef.current) return
    let lastBytes = 0
    let lastTs = Date.now()
    const id = setInterval(async () => {
      const pc = pcRef.current
      if (!pc) return
      const reports = await pc.getStats()
      reports.forEach((r) => {
        if (r.type === 'inbound-rtp' && r.kind === 'video') {
          const now = Date.now()
          const dt = (now - lastTs) / 1000
          const bytes = r.bytesReceived || 0
          const bitrate = dt > 0 ? Math.round(((bytes - lastBytes) * 8) / dt / 1000) : 0
          lastBytes = bytes
          lastTs = now
          setStats({ bitrate, fps: Math.round(r.framesPerSecond || 0) })
        }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state])

  const toggleFullscreen = () => {
    const el = videoRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen()
  }

  return (
    <div className="rtc-viewer">
      <div className="rtc-video-wrap">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="rtc-video"
        />
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
          {state === 'connected' && (
            <span className="rtc-stats">
              {stats.fps} fps · {stats.bitrate} kbps
            </span>
          )}
        </div>
        <div className="rtc-actions">
          {state === 'idle' || state === 'error' ? (
            <button className="btn-primary" onClick={connect}>連線</button>
          ) : (
            <button className="btn-secondary" onClick={disconnect}>中斷</button>
          )}
          <button
            className="btn-ghost"
            onClick={() => setMuted((m) => !m)}
            disabled={state !== 'connected'}
          >
            {muted ? '🔇 取消靜音' : '🔊 靜音'}
          </button>
          <button
            className="btn-ghost"
            onClick={toggleFullscreen}
            disabled={state !== 'connected'}
          >
            ⛶ 全螢幕
          </button>
        </div>
      </div>
    </div>
  )
}

function labelOf(s) {
  return {
    idle: '尚未連線',
    connecting: '連線中…',
    connected: '已連線',
    error: '連線錯誤',
  }[s] || s
}
