# urban-rotary-phone

Frontend WMS prototype inspired by the structure of the EdRoh inventory-management course.

## Current scope

- Czech warehouse dashboard
- stock units / packs
- lot + expiry + box + position
- 2D warehouse position map
- FIFO recommendation
- stock movements: receipt, issue, transfer
- movement audit history + undo last movement
- localStorage data adapter
- ready to replace storage with Google Sheets / REST API later
- static Vite build for GitHub Pages

## Data model

```text
StockPack
  idPack
  idSurovina
  name
  lot
  expiry
  box
  position
  weightG
  status

Movement
  id
  idPack
  timestamp
  deltaG
  type
  note
  fromPosition?
  toPosition?
```

The Open Playlist course uses Next.js, Redux Toolkit, MUI Data Grid, Node, Prisma, PostgreSQL and AWS. This prototype keeps the useful inventory UX/data-model ideas, while deliberately staying static and backend-agnostic.

Course:
https://openplaylist.net/courses/ddKQ8sZo_v8
