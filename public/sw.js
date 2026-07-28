/**
 * Service worker écrit à la main.
 *
 * Vite renomme les fichiers avec une empreinte à chaque build, donc rien n'est
 * pré-listé ici : tout est mis en cache à la première visite. Cela suffit à
 * cette application, dont les données vivent dans Supabase ou dans le
 * navigateur, jamais dans le cache HTTP.
 */

const VERSION = 'equilibre-v1'
const COQUILLE = `${VERSION}-coquille`
const RESSOURCES = `${VERSION}-ressources`
const POLICES = `${VERSION}-polices`

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches.open(COQUILLE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icone.svg'])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(cles.filter((cle) => !cle.startsWith(VERSION)).map((cle) => caches.delete(cle))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const url = new URL(requete.url)

  // Les appels à Supabase ne doivent jamais être servis depuis un cache :
  // des données de santé périmées vaudraient moins que pas de données.
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return

  // Navigation : le réseau d'abord, pour que les mises à jour arrivent.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone()
          caches.open(COQUILLE).then((cache) => cache.put('/', copie))
          return reponse
        })
        .catch(() => caches.match('/').then((cache) => cache ?? Response.error())),
    )
    return
  }

  // Fichiers versionnés par empreinte : le cache d'abord, ils ne changent jamais.
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    evenement.respondWith(
      caches.match(requete).then(
        (cache) =>
          cache ??
          fetch(requete).then((reponse) => {
            const copie = reponse.clone()
            caches.open(RESSOURCES).then((c) => c.put(requete, copie))
            return reponse
          }),
      ),
    )
    return
  }

  // Polices Google : servies depuis le cache, rafraîchies en arrière-plan.
  if (url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')) {
    evenement.respondWith(
      caches.match(requete).then((cache) => {
        const reseau = fetch(requete)
          .then((reponse) => {
            const copie = reponse.clone()
            caches.open(POLICES).then((c) => c.put(requete, copie))
            return reponse
          })
          .catch(() => cache)
        return cache ?? reseau
      }),
    )
  }
})
