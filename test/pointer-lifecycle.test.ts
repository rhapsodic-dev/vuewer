import { describe, expect, it } from 'vitest';
import { useTouchPointerLifecycle } from '../src/composables/touch-pointer-lifecycle';

describe('pointer lifecycle touch bookkeeping', () => {
  it('ignores non-touch pointers when registering and unregistering', () => {
    const touchPointerLifecycle = useTouchPointerLifecycle();

    expect(touchPointerLifecycle.registerPointer('mouse', 1)).toBe(0);
    expect(touchPointerLifecycle.getActiveTouchPointerCount()).toBe(0);

    expect(touchPointerLifecycle.unregisterPointer('mouse', 1)).toBe(0);
    expect(touchPointerLifecycle.getActiveTouchPointerCount()).toBe(0);
  });

  it('detects multi-touch when two active touch pointers exist', () => {
    const touchPointerLifecycle = useTouchPointerLifecycle();

    expect(touchPointerLifecycle.registerPointer('touch', 11)).toBe(1);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(false);

    expect(touchPointerLifecycle.registerPointer('touch', 22)).toBe(2);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(true);
  });

  it('clears stale touch pointers after reset and allows fresh tracking', () => {
    const touchPointerLifecycle = useTouchPointerLifecycle();

    touchPointerLifecycle.registerPointer('touch', 1);
    touchPointerLifecycle.registerPointer('touch', 2);
    expect(touchPointerLifecycle.getActiveTouchPointerCount()).toBe(2);

    touchPointerLifecycle.clearPointers();
    expect(touchPointerLifecycle.getActiveTouchPointerCount()).toBe(0);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(false);

    expect(touchPointerLifecycle.registerPointer('touch', 99)).toBe(1);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(false);
  });

  it('stops multi-touch state when one pointer ends', () => {
    const touchPointerLifecycle = useTouchPointerLifecycle();

    touchPointerLifecycle.registerPointer('touch', 1);
    touchPointerLifecycle.registerPointer('touch', 2);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(true);

    touchPointerLifecycle.unregisterPointer('touch', 1);
    expect(touchPointerLifecycle.getActiveTouchPointerCount()).toBe(1);
    expect(touchPointerLifecycle.hasMultiTouch('touch')).toBe(false);
  });
});
