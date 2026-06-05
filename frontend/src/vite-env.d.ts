/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_AIO_USERNAME: string
  readonly VITE_AIO_KEY: string
  readonly VITE_ADAFRUIT_BASE_URL: string
  readonly VITE_DATA_PROVIDER: string
  readonly VITE_OHSTEM_SERVER_URL: string
  readonly VITE_ENABLE_VOICE_CONTROL: string
  readonly VITE_ENABLE_AUTO_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
