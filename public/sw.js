/**
 * Service worker écrit à la main.
 *
 * Vite renomme les fichiers avec une empreinte à chaque build, donc rien n'est
 * pré-listé ici : tout est mis en cache à la première visite. Cela suffit à
 * cette application, dont les données vivent dans Supabase ou dans le
 * navigateur, jamais dans le cache HTTP.
 */

// Changer ce nom purge les caches précédents à l'activation : c'est ce qui
// débarrasse les installations existantes de l'ancienne icône et de l'ancienne
// coquille au moment du passage à Mamakilo.
const VERSION = 'mamakilo-v1'
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

  // Les analyses d'assiette passent par le réseau, toujours : une réponse en
  // cache serait celle d'une autre photo.
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return

  // Fichiers versionnés par empreinte : le cache d'abord, ils ne changent
  // jamais. C'est aussi ce qui garde le décodeur de codes-barres (un .wasm
  // émis dans /assets/) disponible hors connexion après le premier scan.
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

  // Le moteur OCR et le modèle français, servis depuis `public/` et non depuis
  // `/assets/` : ils ne portent pas d'empreinte, donc la règle ci-dessus ne les
  // couvre pas. Le cache d'abord quand même, parce que leur contenu est figé
  // (un binaire WebAssembly et un modèle de langue ne changent qu'avec le
  // projet) et surtout parce qu'ils pèsent près de trois mégaoctets : les
  // retélécharger à chaque ticket serait insupportable, et un ticket se
  // photographie souvent dans un magasin où le réseau ne passe pas.
  //
  // Leur renouvellement passe donc par `VERSION`, comme le reste de la coquille.
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/ocr/') || url.pathname.startsWith('/tessdata/'))
  ) {
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

  // Les photos de plats : le cache d'abord, mais **jamais préchargées**.
  //
  // Les soixante-neuf images pèsent une douzaine de mégaoctets au total. Les
  // ajouter à la liste d'installation ferait payer ce prix à quelqu'un qui
  // n'ouvrira jamais la carbonade ; les mettre en cache au fil des consultations
  // ne coûte que ce qu'on regarde, et rend la fiche déjà vue disponible hors
  // connexion — devant un rayon, c'est précisément là qu'on la rouvre.
  //
  // Leur contenu ne change qu'avec une exécution d'`outils/photos.mjs`, donc le
  // renouvellement passe par `VERSION`, comme le reste.
  if (url.origin === self.location.origin && url.pathname.startsWith('/plats/')) {
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
