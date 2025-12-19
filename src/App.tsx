import { createSignal, onMount } from "solid-js"
import Navigator from "./components/Navigator"
import Video from "./components/Video"
import { loadM3U, decodeM3U, type M3UChannel, type M3UPlaylist } from "@libs/m3u"

export default function App() {
  let videoRef: HTMLElement | undefined
  const [data, setData] = createSignal<M3UPlaylist>({ channels: [] })
  const [mountPoint, setMountPoint] = createSignal<HTMLElement | undefined>(undefined)
  const [channelInfo, setChannelInfo] = createSignal<{ url: string; logo: string }>({ url: "", logo: "" })

  const changeChannel = (channel: M3UChannel) => {
    setChannelInfo({ url: channel.url, logo: channel.tvg?.logo ?? "" })
    document.title = `${channel.name}`
  }

  onMount(async () => {
    const response = await loadM3U("https://iptv-org.github.io/iptv/index.m3u");
    const data = decodeM3U(response ?? "");
    setData(data);
  });
  return (
    <section class="w-screen h-screen">
      {<Navigator data={data()} changeChannel={changeChannel} mountPoint={() => mountPoint()} />}
      <Video ref={(el) => { videoRef = el; setMountPoint(el) }} src={channelInfo().url} logo={channelInfo().logo} />
    </section>
  )
}
