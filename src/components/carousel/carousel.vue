<template>
  <div
    ref="carouselContainer"
    class="vuewer-carousel"
    @pointerdown.stop
    @pointermove.stop
    @pointerup.stop
    @pointercancel.stop
    @wheel.stop.prevent="onCarouselWheel"
  >
    <div
      ref="carouselTrack"
      class="vuewer-carousel__track"
      @transitionrun="onCarouselTrackTransitionRun"
      @transitionend="onCarouselTrackTransitionEnd"
      @transitioncancel="onCarouselTrackTransitionEnd"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useTemplateRef,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from 'vue';
import { getNormalizedWheelDominantAxisDelta } from '../../utils/wheel-delta';

interface Props {
  activeItemId: number | undefined;
}

const props = defineProps<Props>();

const carouselContainer = useTemplateRef<HTMLDivElement>('carouselContainer');
const carouselTrack = useTemplateRef<HTMLDivElement>('carouselTrack');
const internalActiveIndex = ref<number | undefined>();
const activeSwitchRecenteringPending = ref(false);
const activeSwitchMaxWidthTransitionsInFlight = ref(0);
const fallbackFrameIds: {
  first: number | null;
  second: number | null;
} = {
  first: null,
  second: null,
};
const lifecycleState: { resizeObserver: ResizeObserver | null } = {
  resizeObserver: null,
};

function getCarouselItems(): HTMLElement[] {
  if (!carouselTrack.value) {
    return [];
  }

  return [...carouselTrack.value.children].filter((item): item is HTMLElement => item instanceof HTMLElement);
}

function scrollActiveItemIntoView(scrollBehavior: ScrollBehavior): void {
  if (!carouselContainer.value || internalActiveIndex.value === undefined) {
    return;
  }

  const items = getCarouselItems();
  if (items.length === 0 || internalActiveIndex.value >= items.length) {
    return;
  }

  const activeItemElement = items[internalActiveIndex.value];
  if (!activeItemElement) {
    return;
  }

  updateEdgePadding(items);

  const containerWidth = carouselContainer.value.clientWidth;
  const maxScrollLeft = Math.max(0, carouselContainer.value.scrollWidth - containerWidth);
  const targetScrollLeft = (activeItemElement.offsetLeft + (activeItemElement.offsetWidth / 2)) - (containerWidth / 2);
  const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, targetScrollLeft));

  carouselContainer.value.scrollTo({
    left: nextScrollLeft,
    behavior: scrollBehavior,
  });
}

function centerCurrentlyActiveItem(scrollBehavior: ScrollBehavior = 'auto'): void {
  if (props.activeItemId === undefined) {
    internalActiveIndex.value = undefined;
    return;
  }

  const items = getCarouselItems();
  if (items.length === 0) {
    internalActiveIndex.value = undefined;
    return;
  }

  const foundIndex = items.findIndex((item) => item.dataset.carouselItemActive === 'true');

  if (foundIndex === -1) {
    internalActiveIndex.value = 0;
  } else {
    internalActiveIndex.value = foundIndex;
  }

  scrollActiveItemIntoView(scrollBehavior);
}

function onResize(): void {
  centerCurrentlyActiveItem('auto');
}

function cancelFallbackRecentering(): void {
  if (fallbackFrameIds.first !== null) {
    cancelAnimationFrame(fallbackFrameIds.first);
    fallbackFrameIds.first = null;
  }

  if (fallbackFrameIds.second !== null) {
    cancelAnimationFrame(fallbackFrameIds.second);
    fallbackFrameIds.second = null;
  }
}

function finalizeSwitchRecenteringIfSettled(): void {
  if (!activeSwitchRecenteringPending.value) {
    return;
  }

  if (activeSwitchMaxWidthTransitionsInFlight.value > 0) {
    return;
  }

  centerCurrentlyActiveItem('smooth');
  activeSwitchRecenteringPending.value = false;
}

function scheduleFallbackRecenteringForSwitch(): void {
  cancelFallbackRecentering();

  fallbackFrameIds.first = requestAnimationFrame(() => {
    fallbackFrameIds.first = null;

    fallbackFrameIds.second = requestAnimationFrame(() => {
      fallbackFrameIds.second = null;
      finalizeSwitchRecenteringIfSettled();
    });
  });
}

function isCarouselItemMaxWidthTransition(event: TransitionEvent): boolean {
  const transitionTarget = event.target;
  if (!(transitionTarget instanceof HTMLElement)) {
    return false;
  }

  if (event.propertyName !== 'max-width') {
    return false;
  }

  return carouselTrack.value?.contains(transitionTarget) ?? false;
}

function onCarouselTrackTransitionRun(event: TransitionEvent): void {
  if (!activeSwitchRecenteringPending.value) {
    return;
  }

  if (!isCarouselItemMaxWidthTransition(event)) {
    return;
  }

  activeSwitchMaxWidthTransitionsInFlight.value += 1;
}

function onCarouselTrackTransitionEnd(event: TransitionEvent): void {
  if (!activeSwitchRecenteringPending.value) {
    return;
  }

  if (!isCarouselItemMaxWidthTransition(event)) {
    return;
  }

  activeSwitchMaxWidthTransitionsInFlight.value = Math.max(0, activeSwitchMaxWidthTransitionsInFlight.value - 1);
  finalizeSwitchRecenteringIfSettled();
}

function onCarouselWheel(event: WheelEvent): void {
  if (!carouselContainer.value) {
    return;
  }

  const dominantDelta = getNormalizedWheelDominantAxisDelta(event);
  if (!dominantDelta) {
    return;
  }

  carouselContainer.value.scrollLeft += dominantDelta;
}

function updateEdgePadding(items: HTMLElement[]): void {
  if (!carouselContainer.value || items.length === 0) {
    return;
  }

  const firstItem = items[0];
  const lastItem = items.at(-1);

  if (!firstItem || !lastItem) {
    return;
  }

  const containerWidth = carouselContainer.value.clientWidth;
  const startPadding = Math.max(0, (containerWidth / 2) - (firstItem.offsetWidth / 2));
  const endPadding = Math.max(0, (containerWidth / 2) - (lastItem.offsetWidth / 2));

  carouselContainer.value.style.setProperty('--vuewer-carousel-edge-padding-start', `${startPadding}px`);
  carouselContainer.value.style.setProperty('--vuewer-carousel-edge-padding-end', `${endPadding}px`);
}

watch(() => props.activeItemId, (_, previousActiveItemId) => {
  const scrollBehavior: ScrollBehavior = previousActiveItemId === undefined ? 'auto' : 'smooth';
  if (scrollBehavior === 'smooth') {
    activeSwitchRecenteringPending.value = true;
  } else {
    activeSwitchRecenteringPending.value = false;
  }
  activeSwitchMaxWidthTransitionsInFlight.value = 0;

  nextTick(() => {
    centerCurrentlyActiveItem(scrollBehavior);
    if (scrollBehavior === 'smooth') {
      scheduleFallbackRecenteringForSwitch();
    }
  });
}, { immediate: true });

defineExpose({
  centerCurrentlyActiveItem,
});

onMounted(() => {
  nextTick(() => {
    centerCurrentlyActiveItem('auto');
  });
  window.addEventListener('resize', onResize);

  if (typeof ResizeObserver !== 'undefined') {
    lifecycleState.resizeObserver = new ResizeObserver(() => {
      const items = getCarouselItems();
      updateEdgePadding(items);
      centerCurrentlyActiveItem(activeSwitchRecenteringPending.value ? 'smooth' : 'auto');
    });

    if (carouselContainer.value) {
      lifecycleState.resizeObserver.observe(carouselContainer.value);
    }

    if (carouselTrack.value) {
      lifecycleState.resizeObserver.observe(carouselTrack.value);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  cancelFallbackRecentering();
  lifecycleState.resizeObserver?.disconnect();
  lifecycleState.resizeObserver = null;
});
</script>

<style scoped lang="scss">
.vuewer-carousel {
  --vuewer-carousel-edge-padding-start: 0;
  --vuewer-carousel-edge-padding-end: 0;

  position: relative;
  overflow: auto hidden;
  width: calc(100vw - 32px);
  max-width: 100vw;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  &__track {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
    width: max-content;
    height: 90px;
    padding-inline: var(--vuewer-carousel-edge-padding-start) var(--vuewer-carousel-edge-padding-end);
    white-space: nowrap;
  }
}
</style>
