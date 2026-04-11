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
  background-color: #161616;
  color: #ffffff;
  margin: 0;
  font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
}

.container {
  display: grid;
  place-items: center;
  height: 100vh;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
}

.button {
  border: none;
  outline: none;
  display: block;
  background-color: #ffffff;
  border-radius: 8px;
  line-height: normal;
  transition: background-color 0.5s ease;
  cursor: pointer;
}

.open-button {
  font-weight: 500;
  font-size: 20px;
  padding: 15px 20px;
}

.button:hover {
  background-color: #c3c3c3;
}

.close-button {
  position: absolute;
  z-index: 999999;
  top: 10px;
  left: 10px;
  font-size: 14px;
  padding: 5px 10px;
}
</style>
