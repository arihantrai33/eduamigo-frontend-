// iPhone and iPad zoom into a text field whose text is smaller than 16px when it gets focus, and the page stays
// zoomed in. A maximum scale on the viewport stops that. Safari still lets people pinch to zoom (iOS ignores the
// limit for gestures since iOS 10); inside the iOS app the screen does not pinch-zoom, like any native app.
// Android and desktop browsers are left alone, so their pinch-zoom is unaffected.
export function preventIosInputZoom() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const meta = document.querySelector('meta[name="viewport"]');
  if (ios && meta && !meta.content.includes("maximum-scale")) meta.content += ", maximum-scale=1";
}
