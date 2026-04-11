export function useTouchPointerLifecycle() {
  const activeTouchPointerIds = new Set<number>();

  function registerPointer(pointerType: string, pointerId: number): number {
    if (pointerType === 'touch') {
      activeTouchPointerIds.add(pointerId);
    }

    return activeTouchPointerIds.size;
  }

  function unregisterPointer(pointerType: string, pointerId: number): number {
    if (pointerType === 'touch') {
      activeTouchPointerIds.delete(pointerId);
    }

    return activeTouchPointerIds.size;
  }

  function clearPointers(): void {
    activeTouchPointerIds.clear();
  }

  function hasMultiTouch(pointerType: string): boolean {
    return pointerType === 'touch' && activeTouchPointerIds.size > 1;
  }

  function getActiveTouchPointerCount(): number {
    return activeTouchPointerIds.size;
  }

  return {
    registerPointer,
    unregisterPointer,
    clearPointers,
    hasMultiTouch,
    getActiveTouchPointerCount,
  };
}
