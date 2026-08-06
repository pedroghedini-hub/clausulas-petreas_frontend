const CACHE_NAME = "cp-app-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./bundle.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Estratégia "network-first" pros arquivos do próprio app (HTML/JS/
// ícones): sempre tenta buscar a versão mais recente da rede primeiro,
// e só usa a cópia salva se estiver sem internet. Isso garante que uma
// atualização nova apareça assim que publicada, sem depender de um
// segundo carregamento. Chamadas à API (outro domínio, o backend no
// Railway) nunca passam por aqui — sempre vão direto pra rede.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
