<template>
  <div class="vuewer-zoom-controls">
    <span class="vuewer-zoom-controls__value">
      {{ zoomPercentage }}%
    </span>
    <button
      type="button"
      class="vuewer-zoom-controls__reset"
      @click="emit('reset')"
    >
      <IconArrowRotateLeft />
    </button>
  </div>
</template>

<script setup lang="ts">
import IconArrowRotateLeft from '../../icons/arrow-rotate-left.vue';

interface VuewerZoomControlsProps {
  zoomPercentage: number;
}

defineProps<VuewerZoomControlsProps>();

const emit = defineEmits<{
  reset: [];
}>();
</script>

<style scoped lang="scss">
.vuewer-zoom-controls {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 6px 10px;
  color: white;
  background: rgb(0, 0, 0, 0.35);
  border-radius: 999px;
  backdrop-filter: blur(8px);

  &__value {
    min-width: 45px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
  }

  &__reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    color: white;
    cursor: pointer;
    font-size: 14px;
    background: rgb(255, 255, 255, 0.12);
    border: 0;
    border-radius: 999px;
    transition: background 0.2s ease;

    &:hover,
    &:focus-visible {
      background: rgb(255, 255, 255, 0.2);
    }
  }
}
</style>
