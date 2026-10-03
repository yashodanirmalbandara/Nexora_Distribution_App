# Waypoint Logistics

React + TypeScript + Tailwind v4 (Vite). One file per interface:

| URL hash        | File                       | Target device        |
|-----------------|----------------------------|----------------------|
| `#/`            | `src/MainInterface.tsx`    | Role selector (all)  |
| `#/dispatcher`  | `src/DispatcherApp.tsx`    | Desktop → mobile drawer |
| `#/loader`      | `src/LoaderApp.tsx`        | Tablet / mobile      |
| `#/driver`      | `src/DriverApp.tsx`        | Mobile (phone frame on larger screens) |
| `#/store`       | `src/StoreApp.tsx`         | Desktop sidebar / mobile tab bar |
| `#/offline-demo`| `src/OfflineDemo.tsx`      | All                  |

`src/App.tsx` switches between them using the URL hash and stores the light/dark choice.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run typecheck  # optional TypeScript check
```
