export async function GET(request: Request) {
  return new Response(`
    console.log('Nuking rogue service worker...');
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        let promises = [];
        for(let registration of registrations) {
          promises.push(registration.unregister());
        }
        Promise.all(promises).then(() => {
          console.log('Service workers unregistered. Reloading...');
          window.location.reload();
        });
      });
    } else {
      window.location.reload();
    }
  `, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store, max-age=0',
      'Clear-Site-Data': '"cache", "storage", "executionContexts"'
    }
  });
}
