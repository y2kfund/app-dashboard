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
   ```
   for e.g.
   resolved": "git+ssh://git@github.com/y2kfund/app-margin.git#ee098386c00c51f8a3a025424da828b3c6eb25d5",
   The first 6 charecters ee09838 will match the commit ID shown in github for app-margin
   ```
3. delete node_modules
4. npm install Why? This picks up the latest commit ID for margin and puts that inside package-lock.json
5. this creates a new package-lock.json
6. commit this new package-lock.json
7. as soon as the commit is done cloudflare will do a build and if the build is successful then it will deploy.
8. Now the dashboard will pick up the margin new commit ID since the package-lock.json for dashboard if referring to the new commit ID

