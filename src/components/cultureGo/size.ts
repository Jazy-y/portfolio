/**
 * Logical screen size the CultureGo recreation is laid out for (a ~380 dp
 * wide phone). Every host renders it at this size and scales it uniformly, so
 * the layout never gets squeezed.
 */
export const APP_W = 380;
export const APP_H = Math.round((380 * 0.333) / 0.153);
