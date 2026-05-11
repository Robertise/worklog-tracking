# Worklog Ledger

A React-based daily worklog tracker with Excel-style tabs per day. Each day contains multiple time ranges with the following columns:

- Start time
- End time
- Project
- Task description
- Duration (hrs, auto-calculated)
- Status
- Notes

## Features

- Day tabs for multiple worklog dates
- Add/remove time blocks per day
- View-only toggle to prevent edits
- Save data locally as a JSON file
- Import saved worklogs
- Export to XLSX with one sheet per day
- Auto-save to LocalStorage in the browser

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

## Notes

- Time inputs use 24-hour format (e.g., 13:00).
- Duration is calculated only when the end time is after the start time.
- XLSX exports create one tab per day.
- LocalStorage is per browser/device; clearing browser data removes saved worklogs.

## Deployment (GitHub Pages)

This repo is configured for GitHub Pages using GitHub Actions.

1. Push to the `main` branch.
2. In GitHub, enable Pages with “GitHub Actions” as the source.
3. The site will publish to `https://<username>.github.io/worklog-tracking/`.

If you rename the repo, update the `base` in vite.config.js to match.

## License

MIT
