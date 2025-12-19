import type { ExtInfLine, HTTPUrl, M3UChannel, M3UPlaylist } from "./types";
import { isURL, isValidEXTHeader } from "./utils";

const fileHeader = "#EXTM3U";

export async function loadM3U(url: HTTPUrl) {
  try {
    const raw = await fetch(url);
    const data = await raw.text();
    return data;
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
  }
}

export function parseAttributes(data: string): Record<string, string> {
  const regex = /(?<key>\w[\w-]*)="(?<value>[^"]*)"/g;
  const attributes = Array.from(data.matchAll(regex), (v) => [
    v.groups?.key,
    v.groups?.value,
  ]);

  return Object.fromEntries(attributes);
}

export function parseEXT(ext: ExtInfLine) {
  const [info, name] = ext.split(",");

  const splitAt = info.indexOf(" ");

  const duration = Number(info.substring(0, splitAt).split(":")[1]);
  const attributes = parseAttributes(info.substring(splitAt + 1));

  return { name, duration, attributes };
}

export function createChannel(ext: ExtInfLine, url: HTTPUrl): M3UChannel {
  const { name, duration, attributes } = parseEXT(ext);
  const {
    "tvg-id": tvgId,
    "tvg-name": tvgName,
    "tvg-logo": tvgLogo,
    "group-title": groupTitle,
    ...raw
  } = attributes;

  return {
    name: name,
    duration: duration,
    url: url,
    tvg: {
      id: tvgId,
      name: tvgName,
      logo: tvgLogo,
    },
    group: groupTitle,
    raw: raw,
  };
}

export function decodeM3U(m3u: string): M3UPlaylist {
  const isM3U = m3u.startsWith(fileHeader);
  if (!isM3U) throw new Error("Invalid file type!");

  // Seperate header at first new line in case of x-url or similar tags
  const splitAt = m3u.indexOf("\n");
  const header = m3u.substring(0, splitAt);

  const epg = Object.values(parseAttributes(header));

  const headless = m3u.substring(splitAt + 1);
  const entries = headless.split("\r\n")
  const channels = [];

  let lastExtInf: ExtInfLine | null = null;
  for (const line of entries) {
    if (isValidEXTHeader(line)) {
      lastExtInf = line as ExtInfLine;
    } else if (isURL(line) && lastExtInf) {
      channels.push(createChannel(lastExtInf, line as HTTPUrl));
      lastExtInf = null;
    }
  }

  return {
    epg: epg,
    channels: channels,
  };
}
