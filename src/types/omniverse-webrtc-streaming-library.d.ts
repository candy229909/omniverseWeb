// Minimal ambient stub for `@nvidia/omniverse-webrtc-streaming-library`.
// The real package ships its own typings; this stub only exists so the project
// can be type-checked / built in environments that cannot reach NVIDIA's
// private npm registry (https://edge.urm.nvidia.com/...). Once the package is
// installed normally the real types take precedence over this stub.
declare module '@nvidia/omniverse-webrtc-streaming-library' {
  export type StreamEvent = {
    action?: string
    status?: string
    [key: string]: unknown
  }

  export type DirectConfig = {
    streamType?: 'stream' | 'local'
    videoElementId: string
    audioElementId?: string
    messageElementId?: string
    signalingServer: string
    signalingPort: number
    mediaServer: string
    mediaPort: number
    authenticate?: boolean
    accessToken?: string
    maxReconnects?: number
    nativeTouchEvents?: boolean
    width?: number
    height?: number
    fps?: number
    onStart?: (event: StreamEvent) => void
    onStop?: (event: StreamEvent) => void
    onUpdate?: (event: StreamEvent) => void
    onCustomEvent?: (event: StreamEvent) => void
    [key: string]: unknown
  }

  export type GFNConfig = {
    GFN: unknown
    catalogClientId: string
    clientId: string
    cmsId: number
    onStart?: (event: StreamEvent) => void
    onStop?: (event: StreamEvent) => void
    onUpdate?: (event: StreamEvent) => void
    onCustomEvent?: (event: StreamEvent) => void
    [key: string]: unknown
  }

  export type StreamProps = DirectConfig | GFNConfig

  export enum StreamType {
    LOCAL = 'local',
    STREAM = 'stream',
    GFN = 'gfn',
  }

  export class AppStreamer {
    static connect(props: StreamProps): Promise<StreamEvent>
    static stop(): Promise<StreamEvent> | void
    static sendMessage(message: string): void
    static setup(props: StreamProps): Promise<StreamEvent>
    static teardown(): void
  }
}
