const WHEEL_DELTA_PIXEL_MODE = 0;
const WHEEL_DELTA_LINE_MODE = 1;
const WHEEL_DELTA_PAGE_MODE = 2;

// Converts line-based wheel delta to pixel-like delta.
const LINE_HEIGHT_IN_PIXELS = 16;
// Converts page-based wheel delta to pixel-like delta.
const PAGE_HEIGHT_IN_PIXELS = 800;

export function isPixelModeWheelEvent(event: WheelEvent): boolean {
  return event.deltaMode === WHEEL_DELTA_PIXEL_MODE;
}

export function getWheelDeltaModeMultiplier(deltaMode: number): number {
  // Wheel deltas can be reported in different units depending on device/browser.
  // We normalize all modes to "pixel-like" units before applying gesture math.
  //
  // References:
  // - deltaMode: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
  // - WheelEvent: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent
  //
  // Heuristics:
  // - line mode is approximated using a typical line height (16px)
  // - page mode is approximated using a typical viewport height (800px)
  //
  // `deltaMode` values and practical examples:
  // - 0 (pixels):
  //   most trackpads and many modern browser/device combos.
  //   Example: deltaY = 48 means "48px worth of wheel movement" (multiplier = 1).
  // - 1 (lines):
  //   common with traditional mouse wheels in Firefox and some OS/browser setups.
  //   Example: deltaY = 3 lines -> 3 * 16 = 48 normalized pixels.
  // - 2 (pages):
  //   uncommon; appears when wheel input is reported as page jumps.
  //   Example: deltaY = 1 page -> 1 * 800 = 800 normalized pixels.
  //
  // End-to-end example:
  // - Raw events [deltaY=3, mode=1] and [deltaY=48, mode=0] both normalize to ~48,
  //   so zoom/scroll tuning feels closer across devices.
  if (deltaMode === WHEEL_DELTA_LINE_MODE) {
    return LINE_HEIGHT_IN_PIXELS;
  }

  if (deltaMode === WHEEL_DELTA_PAGE_MODE) {
    return PAGE_HEIGHT_IN_PIXELS;
  }

  return WHEEL_DELTA_PIXEL_MODE + 1;
}

export function normalizeWheelDelta(delta: number, deltaMode: number): number {
  return delta * getWheelDeltaModeMultiplier(deltaMode);
}

export function normalizeWheelDeltaY(event: WheelEvent): number {
  return normalizeWheelDelta(event.deltaY, event.deltaMode);
}

export function getNormalizedWheelDominantAxisDelta(event: WheelEvent): number {
  const absDeltaX = Math.abs(event.deltaX);
  const absDeltaY = Math.abs(event.deltaY);
  const dominantAxisDelta = absDeltaX > absDeltaY
    ? event.deltaX
    : event.deltaY;

  return normalizeWheelDelta(dominantAxisDelta, event.deltaMode);
}
