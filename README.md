<p align="center">
  <a href="https://github.com/rhapsodic-dev/vuewer">
    <img width="70" src="./.github/logo.svg" alt="Vuewer logo">
  </a>
</p>
<h1 align="center">@rhapsodic/vuewer</h1>
<p align="center">
Image viewer for 
<a href="https://vuejs.org/">
  Vue 3
</a>
applications.
</p>

<p align="center">
  <a href="https://npmjs.com/package/@rhapsodic/vuewer">
    <img src="https://img.shields.io/npm/v/@rhapsodic/vuewer/latest.svg?style=flat&colorA=020420&colorB=00DC82" alt="npm version" />
  </a>
  <a href="https://npm.chart.dev/@rhapsodic/vuewer">
    <img src="https://img.shields.io/npm/dm/@rhapsodic/vuewer?style=flat&colorA=020420&colorB=00DC82" alt="npm downloads" />
  </a>
  <a href="https://npmjs.com/package/@rhapsodic/vuewer">
    <img src="https://img.shields.io/npm/l/@rhapsodic/vuewer?style=flat&colorA=020420&colorB=00DC82" alt="License" />
  </a>
</p>


## Features

- 💪 &nbsp;Type safe integration of Vuewer into your project
- ✨ &nbsp;Viewing multiple or a single image
- 🕹️ &nbsp;A `useVuewer()` composable to access all of vuewer methods.

## Installation

With `pnpm`

```bash
pnpm add @rhapsodic/vuewer
```

Or, with `npm`

```bash
npm install @rhapsodic/vuewer
```

Or, with `yarn`

```bash
yarn add @rhapsodic/vuewer
```

Or, with `bun`

```bash
bun add @rhapsodic/vuewer
```

## Usage

Import `@rhapsodic/vuewer/style.css`
```ts
import { createApp } from 'vue'
import '@rhapsodic/vuewer/style.css'

import App from './App.vue'

createApp(App).mount('#app')
```

```vue
<script setup>
import { useVuewer } from '@rhapsodic/vuewer'

const { open } = useVuewer({
  images: [
    {
      url: 'https://placehold.net/2.png',
      thumbUrl: 'https://placehold.net/3.png',
    },
    'https://placehold.net/5-600x800.png',
  ],
})
</script>

<template>
  <button @click="open">
    Open Vuewer
  </button>
</template>
```
`images` supports both raw strings and objects with thumbnail overrides:
`string | { url: string, thumbUrl?: string }`.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm build:playground
```

## License

[MIT License](./LICENSE)
