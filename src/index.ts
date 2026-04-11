import type { App, Plugin } from 'vue';
import Vuewer from './components/vuewer.vue';
import './style.css';

export type {
  VuewerEmits,
  VuewerImage,
  VuewerImageObject,
  VuewerProps,
} from './components';
export { useVuewer } from './composables/vuewer';
export type { UseVuewerOptions } from './composables/vuewer';

export const VuewerPlugin: Plugin = {
  install(app: App) {
    app.component('Vuewer', Vuewer);
  },
};

export default VuewerPlugin;

export { default as Vuewer } from './components/vuewer.vue';
