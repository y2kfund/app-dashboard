# app-dashboard

Vue 3 app that renders **"dashboard"**.

## Scripts
```bash
pnpm install   # or npm install / yarn
pnpm dev       # start dev server (http://localhost:5100)
pnpm build     # production build
pnpm preview   # preview built app (http://localhost:5173)
```
## What steps to take when one of the components used by app-dashboard is updated?
1. delete package-lock.json Why? For e.g. for the component Margin there is a github URL inside package-lock.json that has a commit ID.
2. delete node_modules
3. npm install Why? This picks up the latest commit ID for margin and puts that inside package-lock.json
4. this creates a new package-lock.json
5. commit this new package-lock.json
6. as soon as the commit is done cloudflare will do a build and if the build is successful then it will deploy.
7. Now the dashboard will pick up the margin new commit ID since the package-lock.json for dashboard if referring to the new commit ID

