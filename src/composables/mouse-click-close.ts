import type { Ref } from 'vue';
import { ref } from 'vue';

export interface UseMouseClickCloseOptions {
  imageRef?: Ref<HTMLImageElement | null>;
  onClose?: () => void;
}

export function useMouseClickClose(options: UseMouseClickCloseOptions = {}) {
  const contentRef = ref<HTMLElement | null>(null);
  const closePointerId = ref<number>();
  const closeStartClientX = ref(0);
  const closeStartClientY = ref(0);
  const didClosePointerMove = ref(false);

  function resetClosePointerState(): void {
    closePointerId.value = undefined;
    didClosePointerMove.value = false;
  }

  function isPointerTargetInsideContent(target: EventTarget | null): boolean {
    const content = contentRef.value;

    return Boolean(content && target instanceof Node && content.contains(target));
  }

  function isPointerTargetInsideImage(target: EventTarget | null): boolean {
    const image = options.imageRef?.value;

    return Boolean(image && target instanceof Node && image.contains(target));
  }

  function isClosePointer(event: PointerEvent): boolean {
    if (event.pointerType === 'touch') {
      return true;
    }

    return event.pointerType === 'mouse' && event.button === 0;
  }

  function hasClosePointerMoved(event: PointerEvent): boolean {
    return event.clientX !== closeStartClientX.value || event.clientY !== closeStartClientY.value;
  }

  function onViewerPointerDown(event: PointerEvent): void {
    resetClosePointerState();

    const isPointerInsideContent = isPointerTargetInsideContent(event.target);
    const isTouchPointerInsideImage = event.pointerType === 'touch' && isPointerTargetInsideImage(event.target);
    const canStartCloseTracking = (
      isClosePointer(event)
      && isPointerInsideContent
      && !isTouchPointerInsideImage
    );

    if (!canStartCloseTracking) {
      return;
    }

    closePointerId.value = event.pointerId;
    closeStartClientX.value = event.clientX;
    closeStartClientY.value = event.clientY;
  }

  function onViewerPointerMove(event: PointerEvent): void {
    if (closePointerId.value !== event.pointerId || didClosePointerMove.value) {
      return;
    }

    if (hasClosePointerMoved(event)) {
      didClosePointerMove.value = true;
    }
  }

  function onViewerPointerUp(event: PointerEvent): void {
    const isSamePointer = closePointerId.value === event.pointerId;
    const hasPointerStayedStill = !didClosePointerMove.value && !hasClosePointerMoved(event);
    const shouldClose = (
      isSamePointer
      && hasPointerStayedStill
      && isClosePointer(event)
    );

    resetClosePointerState();

    if (shouldClose) {
      options.onClose?.();
    }
  }

  function onViewerPointerCancel(): void {
    resetClosePointerState();
  }

  return {
    contentRef,
    onViewerPointerDown,
    onViewerPointerMove,
    onViewerPointerUp,
    onViewerPointerCancel,
  };
}
