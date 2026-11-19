import { APP_H, APP_W } from "@/components/cultureGo/size";
import { DESK_TOP } from "./Desk";

/** Shared placement of the project showcases, used by the models and the camera. */
export const MONITOR_CENTER: [number, number, number] = [0, DESK_TOP + 0.38, -0.72];
export const MONITOR_SCREEN: [number, number] = [1.0, 0.42];

/** The phone floats in front of the main monitor when Food Culture Guide is selected. */
export const PHONE_POS: [number, number, number] = [-0.05, DESK_TOP + 0.31, -0.3];
export const PHONE_SIZE = { w: 0.165, h: 0.345, d: 0.017 };
/** Screen of the phone and the CSS size of the app rendered on it (same aspect ratio). */
export const PHONE_SCREEN = { w: 0.153, h: 0.333 };
export const PHONE_APP_PX = { w: APP_W, h: APP_H };
