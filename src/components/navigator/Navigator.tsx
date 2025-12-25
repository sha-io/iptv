import {
    createSignal,
    createMemo,
    splitProps,
    onMount,
    onCleanup,
    Show,
    createEffect,
} from "solid-js";
import { Portal } from "solid-js/web";
import type { M3UChannel, M3UPlaylist } from "@libs/m3u";
import ChannelList from "./ChannelList";
import Search from "./Search";
import KeyHint from "src/ui/KeyHint";

interface NavigatorProps {
    data: M3UPlaylist;
    changeChannel?: (channel: M3UChannel) => void;
    mountPoint?: () => HTMLElement | undefined;
}

const ROW_HEIGHT = 56;
const ROOT_HEIGHT = 400;
const OVERSCAN = 50;

function Navigator(props: NavigatorProps) {
    const [state] = splitProps(props, ["data", "changeChannel", "mountPoint"]);

    const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null)
    const [isOpen, setIsOpen] = createSignal(true);
    const [search, setSearch] = createSignal("");
    const [activeID, setActiveID] = createSignal("");

    const channelsList = createMemo(() => state.data?.channels ?? []);

    const filteredChannels = createMemo(() => {
        const query = search().toLowerCase();
        if (!query) return channelsList();
        return channelsList().filter((c: M3UChannel) => c.name.toLowerCase().includes(query));
    });

    const changeChannelDecorator = (channel: M3UChannel) => {
        state.changeChannel?.(channel);
        setActiveID(channel.url || "");
    };

    const keyboardController = (e: KeyboardEvent) => {
        switch (e.code) {
            case "KeyK":
                if (e.ctrlKey) {
                    e.preventDefault()
                    setIsOpen(!isOpen())
                }
                break;
            case "Escape":
                setIsOpen(false)
                break;
            default:
                break;
        }
    }

    createEffect(() => {
        if (isOpen())
            inputRef()?.focus()
    })

    onMount(() => window.addEventListener("keydown", keyboardController))
    onCleanup(() => window.addEventListener("keydown", keyboardController))

    return (
        <Show when={isOpen()}>
            <Portal mount={state.mountPoint?.()}>
                <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-lg h-[70vh] bg-black/60 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col z-50 font-mono outline-2 outline-white/30">
                    <Search ref={el => setInputRef(el)} oninput={e => setSearch(e.value)} />
                    <ChannelList cellHeight={ROW_HEIGHT} channels={filteredChannels} height={ROOT_HEIGHT} overscan={OVERSCAN} onChannelSelect={changeChannelDecorator} />
                    <div class="flex w-full items-center justify-between px-3 py-2 border-t border-white/10 text-xs shrink-0 font-mono">
                        <span classList={{
                            "text-emerald-500/80": filteredChannels().length > 0,
                            "text-red-500/80": filteredChannels().length == 0
                        }}>
                            {filteredChannels().length} <span class="text-white/30">Channel{filteredChannels().length == 1 ? "" : "s"}</span>
                        </span>
                        <div class="flex items-center gap-2">
                            <KeyHint text="ESC" label="to close" />
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
}

export default Navigator;