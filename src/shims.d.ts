declare module '*.css'

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // eslint-disable-next-line ts/no-explicit-any
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
