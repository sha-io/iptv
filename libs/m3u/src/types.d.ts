export interface M3UChannel {
  name: string;
  url: string;
  duration?: number;
  tvg?: {
    id?: string;
    name?: string;
    logo?: string;
  };
  group?: string;
  raw?: Record<string, string>;
}

export type ExtInfLine = `#EXTINF:${string}`;
export type HTTPUrl = `http://${string}` | `https://${string}`;

export interface M3UPlaylist {
  epg?: string[];
  channels: M3UChannel[];
}
