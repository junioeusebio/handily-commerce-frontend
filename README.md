# Handily Commerce Frontend (Angular 21.2.22)

[![CI](https://github.com/junioeusebio/handily-commerce-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/junioeusebio/handily-commerce-frontend/actions/workflows/ci.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=junioeusebio_handily-commerce-frontend&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=junioeusebio_handily-commerce-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=junioeusebio_handily-commerce-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=junioeusebio_handily-commerce-frontend)

Simple Angular Handily Commerce Frontend app.

**Angular version:** 21.2.22 (`@angular/cli` / `@angular/build` in `package.json`). Runtime packages are `@angular/*` `^21.2.0`.

## Prerequisites

- Node.js 22 or later
- npm 10+

## Run locally

Install dependencies, then start the dev server:

```bash
npm install
npm start
```

`npm start` runs `ng serve`. Open [http://localhost:4200/](http://localhost:4200/). The page shows **Handily Commerce Frontend**.

You can also run:

```bash
npx ng serve
```


## API backend (base URL)

The frontend reads `apiBaseUrl` + `apiVersion` from `src/environments/` (wired via `fileReplacements` in `angular.json` and exposed as `APP_ENVIRONMENT` / `resolveApiRoot()` in `@core`).

| Build | `apiBaseUrl` | `apiVersion` | Resolved root (`resolveApiRoot`) |
| --- | --- | --- | --- |
| development (`ng serve` / default env) | `http://localhost:5228/api` | `v1` | `http://localhost:5228/api/v1` |
| production (`ng build`) | `https://handily-commerce-backend.onrender.com/api` | `v1` | `https://handily-commerce-backend.onrender.com/api/v1` |

**Assumption:** the paired backend (`junioeusebio/handily-commerce-backend`) `http` launch profile uses `applicationUrl` **http://localhost:5228** (`launchSettings.json`), with `Api:RoutePrefix=api` and `Api:Version=v1` in `appsettings.json`. Health will be `GET {apiRoot}/health` (HTTP client lands in backlog A4).

To point the FE at another BE host while developing, edit `src/environments/environment.development.ts` (and the default `environment.ts` if you run without the development configuration).
Production `ng build` also sets Angular `baseHref` to `/handily-commerce-frontend/` so the app matches the GitHub Pages project path (aligned with the Pages deploy workflow CLI flag). Production `apiBaseUrl` points at the Render backend; the main-page footer shows `WEB: {package.json version} | API: {GET /api/v1/apiVersion}` (depends on BE endpoint + CORS). Live site: https://junioeusebio.github.io/handily-commerce-frontend/


## Build

```bash
npx ng build
```

Production output is written to `dist/`.

## Tests

```bash
npx ng test
```
