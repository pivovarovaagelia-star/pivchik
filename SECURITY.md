# API keys and credentials

Never commit API keys, access tokens, passwords, payment credentials, or `.env` files. Anything embedded in a browser application is visible to visitors and must not be treated as a secret.

A TMDB read token was shared in the project conversation. Revoke that token and issue a replacement before using it again. The current frontend stores a token entered in its settings in the browser's local storage; this is suitable only for personal testing, not as a secure production credential strategy. A public deployment should proxy catalog requests through a server-side integration and store secrets in the hosting provider's secret manager.

Report suspected credential exposure by rotating/revoking the affected credential immediately.
