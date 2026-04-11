<template>
  <label
    class="vuewer-navigation-button"
    :class="[`vuewer-navigation-button_side_${side}`]"
  >
    <VuewerButton @click="emit('click', $event)">
      <slot />
    </VuewerButton>
  </label>
</template>

<script setup lang="ts">
import type { VuewerNavigationButtonProps } from '.';
import type { VuewerButtonEmits } from '../../button';
import VuewerButton from '../../button/button.vue';

defineProps<VuewerNavigationButtonProps>();

const emit = defineEmits<VuewerButtonEmits>();
</script>

<style scoped lang="scss">
.vuewer-navigation-button {
  position: fixed;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  cursor: pointer;

  &_side {
    &_left {
      left: 0;
      padding-right: 48px;
      padding-left: 12px;
    }

    &_right {
      right: 0;
      padding-right: 12px;
      padding-left: 48px;
    }
  }

  @media (min-width: 769px) {
    &_side {
      &_left {
        padding-right: 120px;
        padding-left: 20px;
      }

      &_right {
        padding-right: 20px;
        padding-left: 120px;
      }
    }
  }
}
</style>
