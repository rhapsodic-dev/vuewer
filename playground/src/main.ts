import { createApp } from 'vue';

import App from './App.vue';
import VuewerPlugin from '../../src';
import '../../src/style.css';

createApp(App)
  .use(VuewerPlugin)
  .mount('#app');
