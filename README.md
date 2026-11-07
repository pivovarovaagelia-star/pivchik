## Update from the supplied design reference

Home catalog rows use horizontally scrolling poster lanes and the hero banner uses a brighter blue/lavender fairytale palette. This is a CSS approximation: the exact artwork in the screenshot (logo, castle illustration and beer mascot) was not included as an image asset in this repository. Add a licensed image file to `public/` and wire it as the hero background to reproduce that artwork accurately.

There is no licensed movie/series/anime video provider configured. The disabled “Смотреть” action is intentional; TMDB/AniList provide metadata and provider discovery, not playback rights. Do not remove that state or point it at random streams. For actual playback, obtain a provider/rights-holder agreement and integrate their approved player/stream API.
