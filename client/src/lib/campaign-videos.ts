export type CampaignVideo = {
  src: string;
  thumbnail?: string;
  title: string;
  caption: string;
};

const VETERANS_PHASE_1_VIDEO: CampaignVideo | null = {
  src: "/videos/veterans-phase-1.mov",
  thumbnail: "/videos/veterans-phase-1-poster.jpg",
  title: "Veteran Care — Free Help for U.S. Military Veterans",
  caption:
    "Real local support for veterans, families, and those who care for them — housing, benefits, healthcare, jobs and more.",
};

export const CAMPAIGN_VIDEOS: Record<string, CampaignVideo | null> = {
  veteran: VETERANS_PHASE_1_VIDEO,
  general: VETERANS_PHASE_1_VIDEO,
  homepage: VETERANS_PHASE_1_VIDEO,
  case_manager: null,
  partner: null,
};

export function getCampaignVideo(aud: string): CampaignVideo | null {
  return CAMPAIGN_VIDEOS[aud] || null;
}

export function getYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

export function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);
}

export function getThumbnail(v: CampaignVideo): string {
  if (v.thumbnail) return v.thumbnail;
  const yt = getYouTubeId(v.src);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return "";
}

export function getEmbedUrl(
  v: CampaignVideo,
  opts: { autoplay?: boolean; muted?: boolean } = {}
): string | null {
  const yt = getYouTubeId(v.src);
  if (yt) {
    const p = new URLSearchParams({
      autoplay: opts.autoplay ? "1" : "0",
      mute: opts.muted ? "1" : "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    return `https://www.youtube.com/embed/${yt}?${p.toString()}`;
  }
  const vm = getVimeoId(v.src);
  if (vm) {
    const p = new URLSearchParams({
      autoplay: opts.autoplay ? "1" : "0",
      muted: opts.muted ? "1" : "0",
      playsinline: "1",
    });
    return `https://player.vimeo.com/video/${vm}?${p.toString()}`;
  }
  return null;
}
