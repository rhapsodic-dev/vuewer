import { ref } from 'vue';

export interface UseMouseClickCloseOptions {
  onClose?: () => void;
}

export function useMouseClickClose(options: UseMouseClickCloseOptions = {}) {
  const contentRef = ref<HTMLElement | null>(null);
  const closePointerId = ref<number | null>(null);
  const closeStartClientX = ref(0);
  const closeStartClientY = ref(0);
  const didClosePointerMove = ref(false);

  function resetClosePointerState(): void {
    closePointerId.value = null;
    didClosePointerMove.value = false;
  }

  function isPointerTargetInsideContent(target: EventTarget | null): boolean {
    const content = contentRef.value;

    return Boolean(content && target instanceof Node && content.contains(target));
  }

  function hasClosePointerMoved(event: PointerEvent): boolean {
    return event.clientX !== closeStartClientX.value || event.clientY !== closeStartClientY.value;
  }

  function onViewerPointerDown(event: PointerEvent): void {
    resetClosePointerState();

    const isMousePointer = event.pointerType === 'mouse';
    const isPrimaryButton = event.button === 0;
    const isPointerInsideContent = isPointerTargetInsideContent(event.target);
    const canStartCloseTracking = isMousePointer && isPrimaryButton && isPointerInsideContent;

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
    const isMousePointer = event.pointerType === 'mouse';
    const isPrimaryButton = event.button === 0;
    const hasPointerStayedStill = !didClosePointerMove.value && !hasClosePointerMoved(event);
    const shouldClose = (
      isSamePointer
      && hasPointerStayedStill
      && isMousePointer
      && isPrimaryButton
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
