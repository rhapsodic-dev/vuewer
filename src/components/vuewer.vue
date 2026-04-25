<template>
  <div
    v-bind="attrs"
    ref="viewerRef"
    class="vuewer"
    :class="{
      vuewer_hide_ui: idle,
      vuewer_state_touch_dismissing: touchSwipeDismiss.isDismissDragging.value,
    }"
    :style="touchSwipeDismiss.viewerStyle.value"
    @pointerdown="onViewerPointerDown"
    @pointermove="onViewerPointerMove"
    @pointerup="onViewerPointerUp"
    @pointercancel="onViewerPointerCancel"
  >
    <div class="vuewer__overlay" />
    <div
      ref="contentRef"
      class="vuewer__content"
    >
      <img
        ref="activeImageRef"
        :src="currentImage?.url"
        alt=""
        class="vuewer__active-image"
        :class="{
          'vuewer__active-image_state_pannable': pan.isImagePannable.value,
          'vuewer__active-image_state_dragging': pan.isImageDragging.value,
        }"
        :style="{ transform: pan.imageTransform.value }"
        draggable="false"
        @load="pan.onImageLoad"
      >
    </div>

    <div class="vuewer__ui">
      <template v-if="images.length > 1">
        <VuewerNavigationButton
          side="left"
          @click="goToPrevImage"
        >
          <IconAngleLeft />
        </VuewerNavigationButton>
        <VuewerNavigationButton
          side="right"
          @click="goToNextImage"
        >
          <IconAngleRight />
        </VuewerNavigationButton>
      </template>

      <VuewerCloseButton @click="emit('close')" />
    </div>

    <template v-if="hasNonInitialZoom || images.length > 1">
      <div class="vuewer__navigation">
        <template v-if="hasNonInitialZoom">
          <VuewerZoomControls
            :zoom-percentage="zoomPercentage"
            @reset="resetScale"
          />
        </template>
        <template v-if="images.length > 1">
          <div class="vuewer__images">
            <VuewerCarousel :active-item-id="currentImage?.id">
              <template
                v-for="[key, image] in imagesMap"
                :key="key"
              >
                <VuewerCarouselItem
                  :is-active="image.id === currentImage?.id"
                  @click="setActiveImage(image.id)"
                >
                  <img
                    :src="image.thumbUrl"
                    alt=""
                  >
                </VuewerCarouselItem>
              </template>
            </VuewerCarousel>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useIdle } from '@vueuse/core';
import {
  computed, useAttrs, ref, watch, onMounted, onBeforeUnmount,
} from 'vue';

import VuewerNavigationButton from './navigation/button/button.vue';
import VuewerCloseButton from './close/button/button.vue';
import VuewerCarousel from './carousel/carousel.vue';
import VuewerCarouselItem from './carousel/item/item.vue';
import IconAngleLeft from './icons/angle-left.vue';
import IconAngleRight from './icons/angle-right.vue';
import VuewerZoomControls from './zoom/controls/controls.vue';
import { useVuewerZoom } from '../composables/zoom';
import { useVuewerPan } from '../composables/pan';
import { useSwipeNavigation } from '../composables/swipe-navigation';
import { useWheelZoomTuning } from '../composables/wheel-zoom-tuning';
import { useWheelScrollTuning } from '../composables/wheel-scroll-tuning';
import { useMouseClickClose } from '../composables/mouse-click-close';
import { useTouchSwipeDismiss } from '../composables/touch-swipe-dismiss';

import type { VuewerProps, VuewerEmits, VuewerImage } from '.';

interface ImageItem {
  id: number;
  url: string;
  thumbUrl: string;
}

const props = withDefaults(defineProps<VuewerProps>(), {
  defaultIndex: 0,
});
const emit = defineEmits<VuewerEmits>();

const attrs = useAttrs();

const { idle } = useIdle(1500);

function normalizeImage(image: VuewerImage): Omit<ImageItem, 'id'> {
  if (typeof image === 'string') {
    return {
      url: image,
      thumbUrl: image,
    };
  }

  return {
    url: image.url,
    thumbUrl: image.thumbUrl ?? image.url,
  };
}

const imagesMap = computed<Map<number, ImageItem>>(() => {
  const newMap = new Map<number, ImageItem>();
  props.images.forEach((image, index) => {
    const imageId = index;
    const normalizedImage = normalizeImage(image);
    newMap.set(imageId, { id: imageId, ...normalizedImage });
  });
  return newMap;
});

const defaultImage = computed(() => {
  if (props.defaultIndex !== undefined) {
    return imagesMap.value.get(props.defaultIndex) ?? imagesMap.value.values().next().value;
  }

  return imagesMap.value.values().next().value;
});

const viewerRef = ref<HTMLElement | null>(null);
const activeImageRef = ref<HTMLImageElement | null>(null);
const currentImage = ref<ImageItem>();
const zoom = useVuewerZoom({
  zoomableElementRef: viewerRef,
});

const wheelZoom = useWheelZoomTuning({
  onScale: (delta, focalPoint) => zoom.handleScale(delta, focalPoint),
});

const wheelScroll = useWheelScrollTuning({
  onScrollDown: () => goToNextImage(),
  onScrollUp: () => goToPrevImage(),
});
const mouseClickClose = useMouseClickClose({
  imageRef: activeImageRef,
  onClose: () => emit('close'),
});
const contentRef = mouseClickClose.contentRef;

const hasNonInitialZoom = computed(() => Math.abs(zoom.imageScale.value - 1) > 0.001);
const zoomPercentage = computed(() => Math.round(zoom.imageScale.value * 100));
const pan = useVuewerPan({
  viewerRef,
  imageRef: activeImageRef,
  imageScale: zoom.imageScale,
});

const isTouchGestureNavigationEnabled = computed(() => !pan.isImagePannable.value);
const touchSwipeDismiss = useTouchSwipeDismiss({
  viewerRef,
  isEnabled: isTouchGestureNavigationEnabled,
  onDismiss: () => emit('close'),
});

const swipeNavigation = useSwipeNavigation({
  viewerRef,
  imageRef: activeImageRef,
  isSwipeEnabled: isTouchGestureNavigationEnabled,
  onSwipeLeft: () => goToNextImage(),
  onSwipeRight: () => goToPrevImage(),
});
// Bridge zoom scale events to pan logic.
// This keeps zoom centered around the active pointer/touch location
// instead of always zooming around the viewport center.
zoom.setOnScaleChange(pan.onScaleChange);

function onViewerPointerDown(event: PointerEvent): void {
  mouseClickClose.onViewerPointerDown(event);
  touchSwipeDismiss.onViewerPointerDown(event);
  pan.onViewerPointerDown(event);
  swipeNavigation.onViewerPointerDown(event);
}

function onViewerPointerMove(event: PointerEvent): void {
  mouseClickClose.onViewerPointerMove(event);
  touchSwipeDismiss.onViewerPointerMove(event);
  pan.onViewerPointerMove(event);
  swipeNavigation.onViewerPointerMove(event);
}

function onViewerPointerUp(event: PointerEvent): void {
  touchSwipeDismiss.onViewerPointerUp(event);
  pan.onViewerPointerUp(event);
  swipeNavigation.onViewerPointerUp(event);
  mouseClickClose.onViewerPointerUp(event);
}

function onViewerPointerCancel(event: PointerEvent): void {
  touchSwipeDismiss.onViewerPointerCancel(event);
  pan.onViewerPointerCancel(event);
  swipeNavigation.onViewerPointerCancel(event);
  mouseClickClose.onViewerPointerCancel();
}

function resetScale(): void {
  zoom.resetScale();
  pan.resetPan();
}

function setActiveImage(imageId: number) {
  const image = imagesMap.value.get(imageId);

  if (image) {
    resetScale();
    currentImage.value = image;
    emit('select', imageId);
  } else {
    console.warn(`Image with ID ${imageId} not found.`);
  }
}

function goToNextImage(): void {
  if (!currentImage.value) {
    return;
  }

  const currentId = currentImage.value.id;
  const nextId = (currentId + 1) % imagesMap.value.size;

  setActiveImage(nextId);
}

function goToPrevImage(): void {
  if (!currentImage.value) {
    return;
  }

  const currentId = currentImage.value.id;
  const prevId = (currentId - 1 + imagesMap.value.size) % imagesMap.value.size;

  setActiveImage(prevId);
}

type ImageViewerKeyboardActions = 'esc' | 'escape' | 'arrowleft' | 'arrowright';

const imageViewerKeyboardActions: Record<ImageViewerKeyboardActions, () => void> = {
  esc: onEscape,
  escape: onEscape,
  arrowleft: () => onArrow('left'),
  arrowright: () => onArrow('right'),
};

function onKeyDown(event: KeyboardEvent): void {
  const keyCode = event.key.toLowerCase() as ImageViewerKeyboardActions;

  if (keyCode in imageViewerKeyboardActions) {
    const action = imageViewerKeyboardActions[keyCode];
    action();
  }
}

function onEscape() {
  emit('close');
}

function onArrow(direction: 'left' | 'right') {
  if (props.images.length <= 1) return;
  if (direction === 'left') {
    goToPrevImage();
  } else {
    goToNextImage();
  }
}

function onWheel(event: WheelEvent): void {
  event.preventDefault();

  if (event.ctrlKey) {
    wheelScroll.resetWheelScrollState();
    wheelZoom.handleWheelZoom(event);
    return;
  }

  if (props.images.length <= 1) {
    wheelScroll.resetWheelScrollState();
    return;
  }

  wheelScroll.handleWheelScroll(event);
}

watch(imagesMap, (newMap) => {
  if (!currentImage.value) {
    currentImage.value = defaultImage.value;
    resetScale();
    return;
  }

  if (currentImage.value && !newMap.has(currentImage.value.id)) {
    currentImage.value = defaultImage.value;
    resetScale();
  }
}, { immediate: true });

onMounted(() => {
  globalThis.addEventListener('keydown', onKeyDown);
  globalThis.addEventListener('wheel', onWheel, { passive: false });
});

onBeforeUnmount(() => {
  globalThis.removeEventListener('keydown', onKeyDown);
  globalThis.removeEventListener('wheel', onWheel);
});
</script>

<style scoped lang="scss">
.vuewer {
  --vuewer__base-ui-opacity: 1;
  --vuewer__touch-dismiss-opacity: 1;
  --vuewer__touch-dismiss-offset-y: 0px;
  --vuewer__touch-dismiss-scale: 1;
  --vuewer__touch-dismiss-transition-duration: 220ms;
  --vuewer__ui-opacity: calc(var(--vuewer__base-ui-opacity) * var(--vuewer__touch-dismiss-opacity));

  position: fixed;
  inset: 0;
  z-index: 1000;
  user-select: none;
  /* Prevent scroll chaining/bounce from leaking to the background page. */
  overscroll-behavior: contain;

  & img {
    width: auto;
    max-width: 100%;
    max-height: 100%;
    margin: 0;
    padding: 0;
  }

  &__overlay {
    position: absolute;
    z-index: -1;
    pointer-events: none;
    background: rgba(1, 0, 18, 0.35);
    inset: 0;
    backdrop-filter: blur(15px);
    opacity: var(--vuewer__touch-dismiss-opacity);
    transition: opacity var(--vuewer__touch-dismiss-transition-duration) ease;
  }

  &__content {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    inset: 0;
    /* Keep native touch gestures from competing with custom viewer zoom/pan. */
    touch-action: none;
    opacity: var(--vuewer__touch-dismiss-opacity);
    transform: translate3d(0, var(--vuewer__touch-dismiss-offset-y), 0) scale(var(--vuewer__touch-dismiss-scale));
    transition:
      transform var(--vuewer__touch-dismiss-transition-duration) ease,
      opacity var(--vuewer__touch-dismiss-transition-duration) ease;
    will-change: transform, opacity;
  }

  &__active-image {
    transform-origin: center center;
    will-change: transform;
    -webkit-user-drag: none;

    &_state {
      &_pannable {
        cursor: grab;
      }

      &_dragging {
        cursor: grabbing;
      }
    }
  }

  &__ui {
    position: fixed;
    z-index: 3;
    opacity: var(--vuewer__ui-opacity);
    transition: opacity var(--vuewer__touch-dismiss-transition-duration) ease;
  }

  &__navigation {
    position: absolute;
    left: 50%;
    bottom: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    padding-bottom: calc(25px + env(safe-area-inset-bottom));
    opacity: var(--vuewer__ui-opacity);
    filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35));
    transition: opacity var(--vuewer__touch-dismiss-transition-duration) ease;
    transform: translateX(-50%);
  }

  &__images {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__nav-button {
    position: absolute;
    top: 50%;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    padding: 15px;
    color: white;
    font-size: 2em;
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    transition: background 0.2s ease;
    transform: translateY(-50%);

    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }

    &--prev {
      left: 20px;
    }

    &--next {
      right: 20px;
    }
  }

  &_hide {
    &_ui {
      --vuewer__base-ui-opacity: 0;
    }
  }

  &_state {
    &_touch {
      &_dismissing {
        .vuewer__overlay,
        .vuewer__content,
        .vuewer__ui,
        .vuewer__navigation {
          transition: none;
        }
      }
    }
  }
}
</style>
