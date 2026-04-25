import { ref } from 'vue';

export function useActivePointer() {
  const activePointerId = ref<number>();

  function capturePointer(element: HTMLElement | null, pointerId: number): void {
    if (!element) {
      return;
    }

    if (!element.hasPointerCapture(pointerId)) {
      element.setPointerCapture(pointerId);
    }
  }

  function releasePointer(element: HTMLElement | null, pointerId: number | undefined = activePointerId.value): void {
    if (pointerId === undefined || !element) {
      return;
    }

    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId);
    }
  }

  function activatePointer(element: HTMLElement | null, pointerId: number): void {
    if (activePointerId.value !== undefined && activePointerId.value !== pointerId) {
      releasePointer(element, activePointerId.value);
    }

    capturePointer(element, pointerId);
    activePointerId.value = pointerId;
  }

  function deactivatePointer(element: HTMLElement | null, pointerId: number | undefined = activePointerId.value): void {
    releasePointer(element, pointerId);

    if (activePointerId.value === pointerId) {
      activePointerId.value = undefined;
    }
  }

  function hasActivePointer(pointerId: number): boolean {
    return activePointerId.value === pointerId;
  }

  function getActivePointerId(): number | undefined {
    return activePointerId.value;
  }

  return {
    activatePointer,
    deactivatePointer,
    hasActivePointer,
    getActivePointerId,
  };
}
