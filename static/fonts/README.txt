Place self-hosted font files here to avoid relying on Google Fonts.

Recommended files (WOFF2):
- InstrumentSans-Regular.woff2
- InstrumentSans-Italic.woff2
- InstrumentSans-Bold.woff2
- InstrumentSerif-Regular.woff2
- InstrumentSerif-Italic.woff2

Notes:
- Filenames must match the ones referenced in /static/app.css.
- Only .woff2 is necessary for modern browsers; add .woff if you need broader support.
- After placing files, no code changes are needed. The app prefers local fonts
  via the "Instrument Sans Local" and "Instrument Serif Local" families, then
  falls back to Google-hosted versions, then to system stacks.
