export type CampaignVideo = {
  src: string;
  thumbnail?: string;
  title: string;
  caption: string;
  /**
   * Optional intrinsic aspect ratio (width / height). When set, the
   * hero container uses this immediately instead of waiting for the
   * <video> metadata event — avoids initial layout jank for known
   * portrait / square sources. For unknown sources (e.g. embed-only
   * YouTube videos), leave undefined and the player will measure on
   * loadedmetadata for direct files, or fall back to 16/9 for embeds.
   */
  aspectRatio?: number;
};

const VETERANS_PHASE_1_VIDEO: CampaignVideo | null = {
  src: "/videos/veterans-phase-1.mov",
  thumbnail: "/videos/veterans-phase-1-poster-portrait.jpg",
  title: "Veteran Care — Free Help for U.S. Military Veterans & Dependents",
  caption:
    "Real local support for veterans, families, and those who care for them — housing, benefits, healthcare, jobs and more.",
  // Source is 1080x1920 (portrait 9:16). Declared so the hero container
  // adopts the right aspect ratio on first paint instead of guessing.
  aspectRatio: 9 / 16,
};

const CASE_MANAGER_PHASE_2_VIDEO: CampaignVideo | null = {
  src: "/videos/case-manager-phase-2.mov",
  thumbnail: "/videos/case-manager-phase-2-poster-portrait.jpg",
  title: "Veteran Care — A Free Tool for Case Managers",
  caption:
    "Connect the veterans, families, and dependents you serve to trusted local resources — housing, benefits, healthcare, jobs and more.",
  // Source is 1080x1920 (portrait 9:16). Same shape as Phase 1.
  aspectRatio: 9 / 16,
};

const PARTNER_PHASE_3_VIDEO: CampaignVideo | null = {
  src: "/videos/partner-phase-3.mov",
  thumbnail: "/videos/partner-phase-3-poster-portrait.jpg",
  title: "Veteran Care — A Trusted Partner Network",
  caption:
    "Reach veterans, families, and caregivers actively looking for the products, services, and support your business offers.",
  // Source is 1080x1920 (portrait 9:16). Same shape as Phase 1 / 2.
  aspectRatio: 9 / 16,
};

const ABOUT_PHASE_7_2_VIDEO: CampaignVideo | null = {
  src: "/videos/about-phase-7-2.mov",
  thumbnail: "/videos/about-phase-7-2-poster-portrait.jpg",
  title: "Why People Are Talking About Veteran Care",
  caption:
    "America's modern, AI-powered support platform for veterans, families, and the people who care for them.",
  // Source is 1080x1920 (portrait 9:16). Same shape as Phases 1–3.
  aspectRatio: 9 / 16,
};

export const CAMPAIGN_VIDEOS: Record<string, CampaignVideo | null> = {
  veteran: VETERANS_PHASE_1_VIDEO,
  general: VETERANS_PHASE_1_VIDEO,
  homepage: VETERANS_PHASE_1_VIDEO,
  case_manager: CASE_MANAGER_PHASE_2_VIDEO,
  partner: PARTNER_PHASE_3_VIDEO,
  about: ABOUT_PHASE_7_2_VIDEO,
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
