import { splitProps, useContext } from "solid-js";
import type { M3UChannel } from "@libs/m3u";
import NoImage from "../../assets/No-Image.svg"

interface ChannelProps {
    id: string; // M3U url
    key: number; // Index in the channel list
    data: M3UChannel;
    height: number
    isFocused?: () => boolean
    isHighlighted?: () => boolean;
    onmousemove: (key: number) => void;
    onclick: (channel: M3UChannel) => void;
}

function Channel(props: ChannelProps) {
    const [{ data, height, isFocused, isHighlighted, onclick, onmousemove }] = splitProps(props, ["data", "height", "isFocused", "isHighlighted", "onclick", "onmousemove"]);

    return (
        <li
            id={data.url}
            class="w-full border-b border-white/20 relative"
            style={{ height: `${height}px` }}
        >
            <button
                type="button"
                disabled={isHighlighted?.()}
                class="w-full h-full flex justify-between items-center px-4 py-2 text-white/80 font-light text-sm font-mono tracking-wide leading-normal transition-colors duration-200"
                classList={{
                    "bg-amber-50/10": isFocused?.() && !isHighlighted?.(),
                    "cursor-pointer": !isHighlighted?.(),
                    "disabled:cursor-auto": isHighlighted?.(),
                    "bg-amber-50/40": isHighlighted?.(),
                }}
                onclick={() => onclick(data)}
                onmousemove={() => onmousemove(props.key)}
            >
                <span class="truncate pr-4">{data.name}</span>
                <img
                    src={data.tvg?.logo ?? NoImage}
                    onError={e => e.currentTarget.src = NoImage}
                    class="w-10 h-10 object-contain shrink-0"
                    alt="channel-logo"
                    loading="lazy"
                />
            </button>
        </li>
    );
}

export default Channel;
