/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CARTO_MAP_URL?: string;
  readonly VITE_CARTO_API_BASE_URL?: string;
  readonly VITE_CARTO_BASEMAPS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
