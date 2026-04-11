<template>
  <button
    type="button"
    class="vuewer-button"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { VuewerButtonEmits } from '.';

const emit = defineEmits<VuewerButtonEmits>();
</script>

<style scoped lang="scss">
.vuewer-button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.35);
  border: 0;
  border-radius: 50%;
  outline: none;
  transition: background 0.2s ease;
  transform: translateY(-50%);

  &:deep(svg) {
    min-width: auto;
  }

  &:hover,
  &:focus-visible {
    background: rgba(0, 0, 0, 0.50);
  }
}
</style>
