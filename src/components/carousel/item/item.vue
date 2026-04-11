<template>
  <button
    type="button"
    class="vuewer-carousel-item"
    :class="{ 'vuewer-carousel-item_state_active': isActive }"
    :data-carousel-item-active="isActive"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { VuewerCarouselItemEmits, VuewerCarouselItemProps } from '.';

withDefaults(defineProps<VuewerCarouselItemProps>(), {
  isActive: false,
});

const emit = defineEmits<VuewerCarouselItemEmits>();
</script>

<style scoped lang="scss">
.vuewer-carousel-item {
  position: relative;
  display: flex;
  flex-shrink: 0;
  max-width: calc(45px * 10 / 7);
  height: 100%;
  max-height: 100%;
  margin: 0;
  padding: 0;
  cursor: pointer;
  border: 0;
  outline: none;
  opacity: .6;
  transition: opacity 0.3s ease-in-out;

  &:deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &_state {
    &_active {
      max-width: 180px;
      opacity: 1;
    }
  }
}
</style>
