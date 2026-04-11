<template>
  <VuewerButton
    class="vuewer-close-button"
    @click="emit('click', $event)"
  >
    <IconXmark />
  </VuewerButton>
</template>

<script setup lang="ts">
import VuewerButton from '../../button/button.vue';
import IconXmark from '../../icons/xmark.vue';
import type { VuewerButtonEmits } from '../../button';

const emit = defineEmits<VuewerButtonEmits>();
</script>

<style scoped lang="scss">
.vuewer-close-button {
  position: fixed;
  top: 30px;
  right: 20px;
}
</style>
