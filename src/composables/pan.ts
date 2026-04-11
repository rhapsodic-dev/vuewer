import type { Ref } from 'vue';
import {
  computed, onBeforeUnmount, onMounted, ref, watch,
} from 'vue';

import { clamp } from '../utils/math';
import { useTouchPointerLifecycle } from './touch-pointer-lifecycle';

import type { ZoomScaleChange } from './zoom';

export interface PanOffsetAtScaleChangeInput {
  previousScale: number;
  nextScale: number;
  currentOffsetX: number;
  currentOffsetY: number;
  focalOffsetFromViewerCenterX: number;
  focalOffsetFromViewerCenterY: number;
}

export interface PanOffset {
  offsetX: number;
  offsetY: number;
}

interface PanBounds {
  maxOffsetX: number;
  maxOffsetY: number;
}

export function getPanOffsetAtScaleChange({
  previousScale,
  nextScale,
  currentOffsetX,
  currentOffsetY,
  focalOffsetFromViewerCenterX,
  focalOffsetFromViewerCenterY,
}: PanOffsetAtScaleChangeInput): PanOffset {
  if (previousScale <= 0 || nextScale <= 0) {
    return {
      offsetX: currentOffsetX,
      offsetY: currentOffsetY,
    };
  }

  const scaleRatio = nextScale / previousScale;

  return {
    offsetX: ((1 - scaleRatio) * focalOffsetFromViewerCenterX) + (scaleRatio * currentOffsetX),
    offsetY: ((1 - scaleRatio) * focalOffsetFromViewerCenterY) + (scaleRatio * currentOffsetY),
  };
}

export interface UseVuewerPanOptions {
  viewerRef: Ref<HTMLElement | null>;
  imageRef: Ref<HTMLImageElement | null>;
  imageScale: Ref<number>;
}

export function useVuewerPan({
  viewerRef,
  imageRef,
  imageScale,
}: UseVuewerPanOptions) {
  const imageOffsetX = ref(0);
  const imageOffsetY = ref(0);
  const maxPanOffsetX = ref(0);
  const maxPanOffsetY = ref(0);
  const activePanPointerId = ref<number | null>(null);
  const panStartClientX = ref(0);
  const panStartClientY = ref(0);
  const panStartOffsetX = ref(0);
  const panStartOffsetY = ref(0);
  const touchPointerLifecycle = useTouchPointerLifecycle();

  const isImagePannable = computed(() => maxPanOffsetX.value > 0 || maxPanOffsetY.value > 0);
  const isImageDragging = computed(() => activePanPointerId.value !== null);
  const imageTransform = computed(() => `translate3d(${imageOffsetX.value}px, ${imageOffsetY.value}px, 0) scale(${imageScale.value})`);

  function resetImagePanPosition(): void {
    imageOffsetX.value = 0;
    imageOffsetY.value = 0;
  }

  function setImagePanOffset(nextOffsetX: number, nextOffsetY: number): void {
    imageOffsetX.value = clampPanOffset(nextOffsetX, maxPanOffsetX.value);
    imageOffsetY.value = clampPanOffset(nextOffsetY, maxPanOffsetY.value);
  }

  function clampPanOffset(value: number, maxOffset: number): number {
    if (maxOffset <= 0) {
      return 0;
    }

    return clamp(value, -maxOffset, maxOffset);
  }

  function recalculatePanBounds(): void {
    const nextBounds = getPanBoundsForScale(imageScale.value);
    if (!nextBounds) {
      maxPanOffsetX.value = 0;
      maxPanOffsetY.value = 0;
      resetImagePanPosition();
      return;
    }

    maxPanOffsetX.value = nextBounds.maxOffsetX;
    maxPanOffsetY.value = nextBounds.maxOffsetY;
    setImagePanOffset(imageOffsetX.value, imageOffsetY.value);
  }

  function getPanBoundsForScale(scale: number): PanBounds | null {
    const viewer = viewerRef.value;
    const image = imageRef.value;

    if (!viewer || !image) {
      return null;
    }

    const viewerWidth = viewer.clientWidth;
    const viewerHeight = viewer.clientHeight;
    const imageNaturalWidth = image.naturalWidth;
    const imageNaturalHeight = image.naturalHeight;

    if (
      viewerWidth <= 0
      || viewerHeight <= 0
      || imageNaturalWidth <= 0
      || imageNaturalHeight <= 0
      || scale <= 0
    ) {
      return { maxOffsetX: 0, maxOffsetY: 0 };
    }

    const containScale = Math.min(
      1,
      viewerWidth / imageNaturalWidth,
      viewerHeight / imageNaturalHeight,
    );
    const renderedWidth = imageNaturalWidth * containScale * scale;
    const renderedHeight = imageNaturalHeight * containScale * scale;

    return {
      maxOffsetX: Math.max(0, (renderedWidth - viewerWidth) / 2),
      maxOffsetY: Math.max(0, (renderedHeight - viewerHeight) / 2),
    };
  }

  function stopImageDragging(): void {
    const pointerId = activePanPointerId.value;
    if (pointerId === null) return;

    const viewer = viewerRef.value;
    if (viewer?.hasPointerCapture(pointerId)) {
      viewer.releasePointerCapture(pointerId);
    }

    activePanPointerId.value = null;
  }

  function clearCurrentImagePanState(): void {
    stopImageDragging();
    touchPointerLifecycle.clearPointers();
    resetImagePanPosition();
    maxPanOffsetX.value = 0;
    maxPanOffsetY.value = 0;
  }

  function resetPan(): void {
    resetImagePanPosition();
    stopImageDragging();
    touchPointerLifecycle.clearPointers();
    recalculatePanBounds();
  }

  function onScaleChange(scaleChange: ZoomScaleChange): void {
    const viewer = viewerRef.value;
    const image = imageRef.value;
    const focalPoint = scaleChange.focalPoint;

    if (!viewer || !image || !focalPoint) {
      // When zoom has no focal point (for example programmatic reset),
      // only keep bounds in sync with the new scale.
      recalculatePanBounds();
      return;
    }

    // Convert screen-space focal point into viewer-centered coordinates and
    // update pan offset so the visual point under the cursor/fingers stays fixed.
    const viewerRect = viewer.getBoundingClientRect();
    const focalOffsetFromViewerCenterX = (focalPoint.clientX - viewerRect.left) - (viewer.clientWidth / 2);
    const focalOffsetFromViewerCenterY = (focalPoint.clientY - viewerRect.top) - (viewer.clientHeight / 2);
    const nextOffset = getPanOffsetAtScaleChange({
      previousScale: scaleChange.previousScale,
      nextScale: scaleChange.nextScale,
      currentOffsetX: imageOffsetX.value,
      currentOffsetY: imageOffsetY.value,
      focalOffsetFromViewerCenterX,
      focalOffsetFromViewerCenterY,
    });
    const nextPanBounds = getPanBoundsForScale(scaleChange.nextScale);

    if (!nextPanBounds) {
      recalculatePanBounds();
      return;
    }

    maxPanOffsetX.value = nextPanBounds.maxOffsetX;
    maxPanOffsetY.value = nextPanBounds.maxOffsetY;
    setImagePanOffset(nextOffset.offsetX, nextOffset.offsetY);
  }

  function onImageLoad(): void {
    recalculatePanBounds();
  }

  function onResize(): void {
    recalculatePanBounds();
  }

  function canStartPanFromPointer(event: PointerEvent): boolean {
    if (!isImagePannable.value) {
      return false;
    }

    if (event.pointerType === 'touch') {
      return true;
    }

    if (event.pointerType === 'mouse') {
      if (event.button !== 0) {
        return false;
      }

      const image = imageRef.value;
      const eventTarget = event.target;
      if (!image || !(eventTarget instanceof Node)) {
        return false;
      }

      return image.contains(eventTarget);
    }

    return true;
  }

  function onViewerPointerDown(event: PointerEvent): void {
    touchPointerLifecycle.registerPointer(event.pointerType, event.pointerId);
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      stopImageDragging();
      return;
    }

    if (!canStartPanFromPointer(event)) {
      return;
    }

    activePanPointerId.value = event.pointerId;
    panStartClientX.value = event.clientX;
    panStartClientY.value = event.clientY;
    panStartOffsetX.value = imageOffsetX.value;
    panStartOffsetY.value = imageOffsetY.value;

    const viewer = viewerRef.value;
    if (viewer && !viewer.hasPointerCapture(event.pointerId)) {
      viewer.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
  }

  function onViewerPointerMove(event: PointerEvent): void {
    if (touchPointerLifecycle.hasMultiTouch(event.pointerType)) {
      stopImageDragging();
      return;
    }

    if (activePanPointerId.value !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - panStartClientX.value;
    const deltaY = event.clientY - panStartClientY.value;

    setImagePanOffset(
      panStartOffsetX.value + deltaX,
      panStartOffsetY.value + deltaY,
    );

    event.preventDefault();
  }

  function onViewerPointerUp(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (activePanPointerId.value === event.pointerId) {
      stopImageDragging();
    }
  }

  function onViewerPointerCancel(event: PointerEvent): void {
    touchPointerLifecycle.unregisterPointer(event.pointerType, event.pointerId);

    if (activePanPointerId.value === event.pointerId) {
      stopImageDragging();
    }
  }

  watch(imageScale, () => {
    recalculatePanBounds();
  });

  onMounted(() => {
    globalThis.addEventListener('resize', onResize);
    recalculatePanBounds();
  });

  onBeforeUnmount(() => {
    clearCurrentImagePanState();
    globalThis.removeEventListener('resize', onResize);
  });

  return {
    onScaleChange,
    imageTransform,
    isImageDragging,
    isImagePannable,
    onImageLoad,
    onViewerPointerDown,
    onViewerPointerMove,
    onViewerPointerUp,
    onViewerPointerCancel,
    resetPan,
  };
}
