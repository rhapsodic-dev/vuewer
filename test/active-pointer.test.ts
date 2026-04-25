import { describe, expect, it } from 'vitest';

import { useActivePointer } from '../src/composables/active-pointer';

function createPointerElement(): { capturedPointerIds: Set<number>; pointerElement: HTMLElement } {
  const capturedPointerIds = new Set<number>();
  const pointerElement = {
    hasPointerCapture(pointerId: number) {
      return capturedPointerIds.has(pointerId);
    },
    releasePointerCapture(pointerId: number) {
      capturedPointerIds.delete(pointerId);
    },
    setPointerCapture(pointerId: number) {
      capturedPointerIds.add(pointerId);
    },
  } as unknown as HTMLElement;

  return {
    capturedPointerIds,
    pointerElement,
  };
}

describe('active pointer', () => {
  it('tracks and clears the active captured pointer', () => {
    const { capturedPointerIds, pointerElement } = createPointerElement();
    const activePointer = useActivePointer();

    activePointer.activatePointer(pointerElement, 7);
    expect(activePointer.getActivePointerId()).toBe(7);
    expect(activePointer.hasActivePointer(7)).toBe(true);
    expect(capturedPointerIds.has(7)).toBe(true);

    activePointer.deactivatePointer(pointerElement);
    expect(activePointer.getActivePointerId()).toBeUndefined();
    expect(activePointer.hasActivePointer(7)).toBe(false);
    expect(capturedPointerIds.has(7)).toBe(false);
  });

  it('does not clear another active pointer when deactivating a different id', () => {
    const { capturedPointerIds, pointerElement } = createPointerElement();
    const activePointer = useActivePointer();

    activePointer.activatePointer(pointerElement, 11);
    activePointer.deactivatePointer(pointerElement, 99);

    expect(activePointer.getActivePointerId()).toBe(11);
    expect(activePointer.hasActivePointer(11)).toBe(true);
    expect(capturedPointerIds.has(11)).toBe(true);
  });
});
