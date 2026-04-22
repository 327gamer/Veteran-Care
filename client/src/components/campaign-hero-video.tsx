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

export default function CampaignHeroVideo({
  audience,
  fallbackLogo,
  platformName,
  className,
}: Props) {
  const video = getCampaignVideo(audience);
  const sessionKey = `vc_video_played_${audience}`;
  const [autoplayed, setAutoplayed] = useState(false);
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

  return (
    <div
      className={`w-full overflow-hidden shadow-2xl ring-1 ring-white/20 bg-black aspect-video ${
        className || "rounded-xl mb-6"
      }`}
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
