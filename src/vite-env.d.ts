/// <reference types="vite/client" />

// Le binaire ZXing entre dans le build par `?url` pour être servi depuis notre
// domaine. Vite connaît la requête, TypeScript non : on la lui déclare.
declare module '*.wasm?url' {
  const url: string
  export default url
}
