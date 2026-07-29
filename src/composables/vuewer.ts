import type { createApp as createAppType } from 'vue';
import {
  ref,
  defineComponent,
  createApp,
  h,
  onUnmounted,
  computed,
} from 'vue';
import type { VuewerImage } from '../components';

import Vuewer from '../components/vuewer.vue';

export interface UseVuewerOptions {
  images: VuewerImage[];
  defaultIndex?: number;
  onSelect?: (index: number) => void;
}

export function useVuewer(options: UseVuewerOptions) {
  let currentVuewerApp: ReturnType<typeof createAppType> | null = null;
  let currentVuewerContainer: HTMLDivElement | null = null;
  const vuewerMounted = ref(false);

  function cleanup() {
    if (currentVuewerApp) {
      currentVuewerApp.unmount();
      currentVuewerApp = null;
    }
    if (currentVuewerContainer) {
      currentVuewerContainer.remove();
      currentVuewerContainer = null;
    }
    vuewerMounted.value = false;
  }

  const VuewerWrapper = defineComponent({
    name: 'Vuewer',
    setup() {
      onUnmounted(() => {
        unmountVuewer();
      });

      function closeVuewer() {
        unmountVuewer();
      }

      return () => h(Vuewer, {
        images: options.images,
        defaultIndex: options.defaultIndex,
        onClose: closeVuewer,
        onSelect: options.onSelect,
      });
    },
  });

  function mountVuewer() {
    if (vuewerMounted.value) {
      console.warn('Vuewer is already opened.');
      return;
    }

    cleanup();

    currentVuewerContainer = document.createElement('div');
    currentVuewerContainer.classList.add('vuewer-container');
    document.body.append(currentVuewerContainer);

    try {
      currentVuewerApp = createApp(VuewerWrapper);
      currentVuewerApp.mount(currentVuewerContainer);
      vuewerMounted.value = true;
    } catch (error) {
      console.error('Failed to mount vuewer:', error);
      cleanup();
    }
  }

  function unmountVuewer() {
    cleanup();
  }

  return {
    open: mountVuewer,
    close: unmountVuewer,
    isOpened: computed(() => vuewerMounted.value),
  };
}
