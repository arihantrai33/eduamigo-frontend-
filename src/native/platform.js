import { Capacitor } from "@capacitor/core";

// True inside the Android or iOS app (Capacitor), false in a browser.
export const isNative = () => Capacitor.isNativePlatform();
export const platformName = () => Capacitor.getPlatform(); // "android" | "ios" | "web"
