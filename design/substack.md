Substack Connector:

Components:

1. A stateless server, responsible for crawling and parsing Substack content, forward the content to clients in either HTML or JSON format. The main purposes of the server are (1) to circumvent the CORS restrictions on remote Substack content (2) to collect all URLs linked by the page, and to classify which of the URLs should be considered as "same-site" (i.e. not directing the user to a different domain)

2. A client, responsible for rendering a connected Substack site, and managing which Substack site is to be connected. Only a .country domain owner is allowed to manage the connection.

Details:

(1) Managing: the .country domain owner should be able to go to /manage page, and provides a single URL for the Substack site they want to connect to. The URL could be a custom domain (e.g. https://blog.harmony.one) powered by Substack, or Substack subdomain (e.g. https://polymorpher.substack.com). The client should retrieve a list of same-site URLs with assistance from the server's APIs, and configure both the landing page and the same-site URLs on the EWS smart contract. See (https://github.com/polymorpher/dot-country-embedder/blob/main/contract/contracts/EWS.sol). EWS expects a landing page URL, and a list of URLs as allowed pages. The rationale is the client should rewrite all URLs in `<a>` tags (and potentially location.href redirects) in "allowed-pages" to just path (e.g. a hash of the URL) under the same .country domain, so when the user clicks on the link, they stay on the same .country site, rather than being sent off to an external site (e.g. Substack itself).

(2) Rendering: the client should first check whether EWS is configured for the .country domain (see Notion Connector implementation for reference). If not, prompt the user to go to /manage for configuration. If it is already configured, the client should retrieve the landing page and allowed pages from EWS smart contract. Now, the client should do one of the following depending on the value of the current browser's URL's path portion:

- if the path is `/`, the client should retrieve the landing page content through the server API. The client then should parse the HTML content using a DOM parser, and rewrite all URLs that are part of allowed pages, as described in (1).
- if the path is not `/`, the client should check whether the path is allowed, based on values of allowed pages (e.g. hash the allowed pages' URLs first, then check whether the path is one of the hashes). If the path is not allowed, a 404 page should be rendered (or, redirect the user back to `/`). If the path is allowed, the client should retrieve the page through the server API, then parse the HTML content using a DOM parser, and rewrite all URLs that are part of allowed pages, as described above.