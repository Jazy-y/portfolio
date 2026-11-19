"use client";

import { Html } from "@react-three/drei";
import { useState } from "react";

const PX_W = 1280;

/**
 * A live, scrollable website rendered on a monitor screen with a CSS3D iframe.
 * Clicks only reach the site in focus mode; otherwise they fall through to the
 * 3D scene (hover label + click to zoom in).
 */
export function LiveSite({ url, size, interactive }: { url: string; size: [number, number]; interactive: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [w, h] = size;
  const pxH = Math.round((PX_W * h) / w);
  return (
    <Html transform position={[0, 0, 0.0152]} scale={(w * 40) / PX_W} zIndexRange={[10, 0]} pointerEvents={interactive ? "auto" : "none"}>
      <div className="live-site" style={{ width: PX_W, height: pxH }} data-loaded={loaded || undefined}>
        <iframe
          src={url}
          title={`Live website: ${new URL(url).hostname}`}
          width={PX_W}
          height={pxH}
          onLoad={() => setLoaded(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          tabIndex={interactive ? 0 : -1}
        />
        {!loaded && <div className="live-site-loading">Loading {new URL(url).hostname}…</div>}
      </div>
    </Html>
  );
}
