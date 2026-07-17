export async function GET(request: Request) {
  return new Response(`
    self.addEventListener('install', (e) => {
      self.skipWaiting();
    });
    self.addEventListener('activate', (e) => {
      e.waitUntil(
        self.registration.unregister().then(() => {
          return self.clients.matchAll();
        }).then((clients) => {
          clients.forEach(client => client.navigate(client.url));
        })
      );
    });
  `, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, max-age=0',
      'Clear-Site-Data': '"cache", "storage", "executionContexts"'
    }
  });
}
