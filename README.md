# Tedium — Archive of Ecologies of LLM Practices

An interactive SvelteKit application for showcasing the Archive of Ecologies of LLM Practices. It presents a narrated timeline with synchronized text, and a period‑based mosaic of media (“floaters”) blending images, videos, and quote interludes.

## Features

- **Narrated timeline**: Audio‑driven progression with synchronized subtitles and smooth auto‑scroll.
- **Period views**: Six periods (intro → March/April) with floating media tiles that ebb and flow across the screen.
- **Quotes as interludes**: Short, self‑contained video quotes punctuate the narrative.
- **Prompt popups**: Occasional chat‑style scrollers that surface prompt fragments from the archive.
- **Responsive media**: Enhanced lazy image loading; video segments hinted via `#t=start,end`.

## Project Structure

- `src/routes/+page.svelte`: Main timeline, audio playback, and subtitle sync.
- `src/routes/second/+page.svelte`: Period mosaic UI, media mapping, and prompt scroller.
- `src/routes/second/+server.js`: Asset registry per period using `import.meta.glob`.
- `src/lib/components/floater.svelte`: Floater tile; renders image/video/quote and handles lifecycle.
- `src/lib/stores/stores.js`: Shared state (current index/period, playback flags, UI toggles).
- `src/lib/media/newJson.json`: Dataset driving the timeline (text, timings, quote entries).
- `static/video_quote_static`: Quote videos (WebM); posters in `static/posters`.

## Media Loading Overview

- **Asset discovery**: Per period, images/videos are exposed via `import.meta.glob` in the server endpoint.
  - `src/routes/second/+server.js:1`
- **Client fetch**: The mosaic page fetches media lists for each period and builds per‑index mappings.
  - `src/routes/second/+page.svelte:89`
- **Distribution**: Roughly 1:1 image/video for periods with videos—evens prefer images; odds favor videos. Images fall back to videos when exhausted.
  - `src/routes/second/+page.svelte:114`
- **Quotes**: Dataset items with `type: "quote"` use `static/video_quote_static/...` regardless of period mapping.
  - `src/lib/media/newJson.json:584`
- **Video segments**: Floater videos include `#t=start,end` in `src` to hint 30s segments; browser performs HTTP Range requests to seek efficiently.
  - `src/lib/components/floater.svelte:572`
- **Preload**: Videos use `preload="metadata"` to avoid full downloads; images use enhanced lazy loading.
  - Quote video: `src/lib/components/floater.svelte:551`
  - Floater video: `src/lib/components/floater.svelte:595`

## Performance Notes

- **Range seeks**: Efficient playback relies on server support for `Accept-Ranges: bytes` and frequent keyframes (WebM/MP4 encoded with ~1–2s GOP).
- **Floater window**: The number of simultaneously rendered floaters controls network/memory pressure. Adjust the limit:
  - `src/routes/second/+page.svelte:191` (`const limit = 200;`).
- **Memory release**: Videos are fully unloaded on unmount (pause → `src=''` → `load()`), freeing buffers promptly.
  - `src/lib/components/floater.svelte:452`
- **Further tuning (optional)**:
  - Switch floater videos to `preload="none"` and lazy‑assign `src` with IntersectionObserver.
  - Reduce floater limit (e.g., 60–80) or compute from viewport.
  - Pre‑segment long videos or adopt HLS/DASH for strict byte budgets.

## Development

- **Prerequisites**: Node.js 18+ (20+ recommended), npm.
- **Install**: `npm install`
- **Dev server**: `npm run dev`
- **Build**: `npm run build` (builds the app, then runs the JSON builder)
- **Preview**: `npm run preview`

> Note: The build script runs `src/lib/scripts/json_builder.js` to prepare dataset artifacts. Ensure media paths referenced by the dataset exist.

## Adding / Updating Media

- **Images**: Place under `src/lib/media/<PERIOD>/` (e.g., `1_SEPTEMBER_OCTOBER`) using common image formats.
- **Videos**: Place under the same period folder using `.webm` (preferred) or `.mp4/.mov`.
- **Quote clips**: Place WebM files in `static/video_quote_static/` and a poster in `static/posters/` named `<file>_poster.webp`.
- **Dataset entries**: Edit `src/lib/media/newJson.json` to add text segments or quotes (`type: "quote"`, `media: "video_quote_static/<file>.webm"`).

### Periods

The app recognizes the following period keys:

`intro`, `september_october`, `november_december`, `january`, `february`, `march_april`

## Controls

- Space / MediaPlayPause: toggle narration timeline play/pause.
- Floaters auto‑play when showcased; quote videos start when their segment is active.

## Configuration

- **Image processing**: Vite plugin `@sveltejs/enhanced-img` for better lazy loading and responsive images.
  - `vite.config.js:1`
- **Adapter**: `@sveltejs/adapter-auto` for flexible deployment.
  - `svelte.config.js:1`

## Deployment Notes

- Serve static assets with partial content support (HTTP Range). Most CDNs/web servers support this by default.
- Ensure the `static/` directory (quote videos and posters) is deployed as‑is.
- For best seek performance, encode videos with frequent keyframes and proper container indexing (WebM Cues / MP4 faststart).

## Contributing

- Use `npm run format` and `npm run lint` before submitting changes.
- Keep heavy media out of version control when possible; prefer pointers and deployment‑time sync.

---

If you need help adjusting the media ratio, reducing floater count, or enabling lazy video sources for lower bandwidth, see the in‑file comments noted above or open an issue/PR.
