<template>
  <div class="container">
    <button
      class="button open-button"
      type="button"
      @click="open"
    >
      Open Vuewer
    </button>
    <template v-if="isOpened">
      <teleport to="body">
        <button
          type="button"
          class="button close-button"
          @click="close"
        >
          Custom close
        </button>
      </teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useVuewer } from '../../src';

const { open, close, isOpened } = useVuewer({
  images: [
    'https://placehold.net/2.png',
    'https://placehold.net/5-600x800.png',
    'https://placehold.net/7-600x800.png',
  ],
});

watch(isOpened, (newVal) => {
  console.log(`Vuewer state: ${newVal ? 'opened' : 'closed'}`);
});
</script>

<style>
body {
  margin: 0;
  color: #ffffff;
  font-family: system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  background-color: #161616;
}

.container {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
  place-items: center;
  height: 100vh;
}

.button {
  display: block;
  line-height: normal;
  cursor: pointer;
  background-color: #ffffff;
  border: none;
  border-radius: 8px;
  outline: none;
  transition: background-color .5s ease;
}

.open-button {
  padding: 15px 20px;
  font-size: 20px;
  font-weight: 500;
}

.button:hover {
  background-color: #c3c3c3;
}

.close-button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 999999;
  padding: 5px 10px;
  font-size: 14px;
}
</style>
