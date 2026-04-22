import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  getCampaignVideo,
  getEmbedUrl,
  isDirectVideoFile,
  getThumbnail,
} from "@/lib/campaign-videos";

type Props = {
  audience: string;
  fallbackLogo?: string;
  platformName?: string;
  className?: string;
};

/**
 * Universal display rule for hero campaign videos:
 *
 *   Container adopts the video's intrinsic aspect ratio (just like
 *   YouTube, Twitter/X, and Instagram web do for portrait or square
 *   uploads). The video then fills its own frame edge-to-edge — no
 *   crop, no letterbox, no skinny strip.
 *
 * Sizing strategy:
 *   - Width is bounded by max-w (≈ 360px for portrait, full width for
 *     landscape) and by viewport width.
 *   - Height is capped by max-h (≈ 75vh on mobile, 70vh on desktop) so
 *     the video never pushes the rest of the hero off-screen.
 *   - Centered with mx-auto.
 *
 * Aspect ratio source (in priority order):
 *   1. Optional `aspectRatio` field on the campaign-videos config
 *      (lets us hard-code known ratios for non-direct embeds).
 *   2. The <video> element's loadedmetadata event (videoWidth /
 *      videoHeight) — set on the fly for direct files.
 *   3. Sensible default of 16/9 while metadata is loading, so the box
 *      doesn't jank.
 */
export default function CampaignHeroVideo({
  audience,
  fallbackLogo,
  platformName,
  className,
}: Props) {
  const video = getCampaignVideo(audience);
  const sessionKey = `vc_video_played_${audience}`;
  const [autoplayed, setAutoplayed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(
    (video as any)?.aspectRatio ?? null
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!video) return;
    try {
      const already = sessionStorage.getItem(sessionKey) === "1";
      if (!already) {
        setAutoplayed(true);
        sessionStorage.setItem(sessionKey, "1");
        trackEvent("campaign_video_autoplay", { audience });
      }
    } catch {
      setAutoplayed(true);
    }
  }, [video, audience, sessionKey]);

  if (!video) {
    if (fallbackLogo) {
      return (
        <img
          src={fallbackLogo}
          alt={platformName || "Veteran Care"}
          className={
            className ||
            "h-48 w-auto object-contain drop-shadow-xl mb-6"
          }
        />
      );
    }
    return null;
  }

  const direct = isDirectVideoFile(video.src);
  const embed = !direct
    ? getEmbedUrl(video, { autoplay: autoplayed, muted: true })
    : null;
  const poster = getThumbnail(video);

  // Resolve aspect ratio: known > measured > default 16/9
  const ar = aspectRatio ?? 16 / 9;
  const isPortrait = ar < 1;

  // Portrait videos: cap width tight (~360px), let height go up to 75vh.
  // Landscape videos: full width up to 720px wide (premium hero feel).
  // Both share the same vertical cap so the layout stays balanced.
  const containerStyle: React.CSSProperties = {
    aspectRatio: `${ar}`,
    maxWidth: isPortrait ? "min(360px, 90vw)" : "min(720px, 95vw)",
    maxHeight: "min(75vh, 640px)",
    width: "auto",
    margin: "0 auto",
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v && v.videoWidth && v.videoHeight) {
      const measured = v.videoWidth / v.videoHeight;
      if (Math.abs(measured - ar) > 0.01) {
        setAspectRatio(measured);
      }
    }
  };

  return (
    <div
      className={`overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black ${
        className || "rounded-xl mb-6"
      }`}
      style={containerStyle}
      data-testid={`hero-video-${audience}`}
    >
      {direct ? (
        <video
          ref={videoRef}
          src={video.src}
          poster={poster || undefined}
          controls
          playsInline
          autoPlay={autoplayed}
          muted={autoplayed}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          className="block w-full h-full object-contain bg-black"
        />
      ) : embed ? (
        <iframe
          src={embed}
          title={video.title}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          className="block w-full h-full border-0 bg-black"
        />
      ) : (
        <img
          src={poster}
          alt={video.title}
          className="block w-full h-full object-contain bg-black"
        />
      )}
    </div>
  );
}
