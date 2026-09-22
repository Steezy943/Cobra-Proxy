// Listen for any network request made by the iframe/proxy page
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip executing the proxy logic on our own local host files (like index.html)
  if (requestUrl.origin === self.location.origin) {
    return;
  }

  // Intercept the request and process it through our native proxy logic
  event.respondWith(
    (async () => {
      try {
        // Construct clean headers for the target site
        const modifiedHeaders = new Headers(event.request.headers);
        modifiedHeaders.set('X-Proxied-By', 'Browser-Service-Worker');

        // Re-forge the exact request layout cleanly from scratch
        const proxyRequest = new Request(event.request, {
          headers: modifiedHeaders,
          mode: 'cors', // Bypass local validation structures 
          credentials: 'omit' 
        });

        // Perform the live network call directly from the browser context
        const response = await fetch(proxyRequest);

        // Re-construct the response so the browser handles things like CSS/JS cleanly
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      } catch (err) {
        return new Response(`Proxy Worker Error: ${err.message}`, { status: 500 });
      }
    })()
  );
});
