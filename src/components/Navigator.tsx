import NoImage from "../assets/No-Image.svg";
import {
    createSignal,
    createMemo,
    createEffect,
    For,
    onCleanup,
    onMount,
    splitProps,
    type Setter,
    type Accessor,
} from "solid-js";
import { Portal } from "solid-js/web";
import type { M3UChannel, M3UPlaylist } from "@libs/m3u";

interface NavigatorProps {
    data: M3UPlaylist;
    changeChannel?: (channel: M3UChannel) => void;
    mountPoint?: () => HTMLElement | undefined;
}

const ROW_HEIGHT = 56;
const ROOT_HEIGHT = 400;
const OVERSCAN = 50;

interface ListItemProps {
    item: M3UChannel;
    index: Accessor<number>;
    selectedIndex: Accessor<number>;
    activeID: Accessor<string>;
    changeChannelDecorator: (channel: M3UChannel, e?: MouseEvent | string) => void;
    setSelectedIndex: Setter<number>;
}

const ListItem = (props: ListItemProps) => {
    const isSelected = createMemo(() => props.index() === props.selectedIndex());
    const isActive = createMemo(() => props.item?.url === props.activeID());

    return (
        <li
            class="w-full border-b border-white/20 relative"
            style={{ height: `${ROW_HEIGHT}px` }}
        >
            <button
                type="button"
                disabled={isActive()}
                class="w-full h-full flex justify-between items-center px-4 py-2 text-white/80 font-light text-sm font-mono tracking-wide leading-normal transition-colors duration-200"
                classList={{
                    "bg-white/30": isSelected(),
                    "cursor-pointer": !isActive(),
                    "disabled:cursor-auto": isActive(),
                    "bg-white/20": isActive(),
                }}
                id={props.item?.url}
                onClick={(e) => props.changeChannelDecorator(props.item, e)}
                onMouseMove={() => props.setSelectedIndex(props.index())}
            >
                <span class="truncate pr-4">{props.item.name}</span>
                <img
                    src={props.item?.tvg?.logo}
                    onError={(e: Event) => {
                        (e.target as HTMLImageElement).src = NoImage;
                    }}
                    class="w-10 h-10 object-contain shrink-0"
                    alt="channel-logo"
                    loading="lazy"
                />
            </button>
        </li>
    );
};

function Navigator(props: NavigatorProps) {
    let inputRef: HTMLInputElement | undefined;
    let listRef: HTMLUListElement | undefined;

    const [state] = splitProps(props, ["data", "changeChannel", "mountPoint"]);


    const [isVisible, setIsVisible] = createSignal(true);
    const [search, setSearch] = createSignal("");
    const [selectedIndex, setSelectedIndex] = createSignal(0);
    const [activeID, setActiveID] = createSignal("");
    const [scrollTop, setScrollTop] = createSignal(0);

    const channelsList = createMemo(() => state.data?.channels ?? []);

    const filteredChannels = createMemo(() => {
        const query = search().toLowerCase();
        if (!query) return channelsList();
        return channelsList().filter((c: M3UChannel) => c.name.toLowerCase().includes(query));
    });


    const visibleRange = createMemo(() => {
        const start = Math.floor(scrollTop() / ROW_HEIGHT);
        const visibleCount = Math.ceil(ROOT_HEIGHT / ROW_HEIGHT);

        const effectiveStart = Math.max(0, start - OVERSCAN);
        const effectiveEnd = Math.min(filteredChannels().length, start + visibleCount + OVERSCAN);

        return [effectiveStart, effectiveEnd];
    });

    const visibleItems = createMemo(() => {
        const [start, end] = visibleRange();
        return filteredChannels().slice(start, end);
    });

    const offsetY = createMemo(() => {
        return visibleRange()[0] * ROW_HEIGHT;
    });

    const changeChannelDecorator = (channel: M3UChannel, e?: MouseEvent | string) => {
        state.changeChannel?.(channel);
        if (typeof e === 'string') {
            setActiveID(e);
        } else {
            setActiveID(channel.url || "");
        }
    };

    const scrollToIndex = (index: number) => {
        if (!listRef) return;
        const itemTop = index * ROW_HEIGHT;
        const itemBottom = itemTop + ROW_HEIGHT;
        const currentScroll = listRef.scrollTop;
        const containerHeight = listRef.clientHeight;

        if (itemTop < currentScroll) {
            listRef.scrollTop = itemTop;
        } else if (itemBottom > currentScroll + containerHeight) {
            listRef.scrollTop = itemBottom - containerHeight;
        }
    };

    const onScroll = (e: Event) => {
        const target = e.currentTarget as HTMLUListElement;
        setScrollTop(target.scrollTop);
    };

    const keyboardController = (e: KeyboardEvent) => {
        const listLength = filteredChannels().length;

        switch (e.code) {
            case "KeyK":
                if (e.ctrlKey) {
                    e.preventDefault();
                    setIsVisible(!isVisible());
                    if (isVisible()) inputRef?.focus();
                }
                break;
            case "Escape":
                e.preventDefault();
                setIsVisible(false);
                break;
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const next = prev + 1 >= listLength ? prev : prev + 1;
                    scrollToIndex(next);
                    return next;
                });
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => {
                    const next = prev - 1 < 0 ? prev : prev - 1;
                    scrollToIndex(next);
                    return next;
                });
                break;
            case "Enter":
                e.preventDefault();
                const channel = filteredChannels()[selectedIndex()];
                if (channel) changeChannelDecorator(channel, channel.url);
                break;
        }
    };

    onMount(() => {
        window.addEventListener("keydown", keyboardController);
        inputRef?.focus();
    });

    onCleanup(() => {
        window.removeEventListener("keydown", keyboardController);
    });

    createEffect(() => {
        const len = filteredChannels().length;
        if (len === 0) {
            setSelectedIndex(-1);
        } else {
            if (selectedIndex() >= len) setSelectedIndex(0);
        }
    });

    return (
        <Portal mount={state.mountPoint?.()}>
            <div
                classList={{ hidden: !isVisible() }}
                class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-[70vh] rounded-lg bg-black/60 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col z-50 font-['Google_Sans'] outline-2 outline-white/30"
            >
                <form class="border-b border-white/20 w-full shrink-0">
                    <div class="relative">
                        <div class="relative w-full">
                            <input
                                ref={inputRef}
                                onInput={(e) => {
                                    setSearch(e.currentTarget.value);
                                    setScrollTop(0);
                                    setSelectedIndex(0);
                                    if (listRef) listRef.scrollTop = 0;
                                }}
                                type="text"
                                placeholder="Search channels..."
                                spellcheck="false"
                                autocomplete="off"

                                class="w-full h-14 pl-4 pr-24 text-white/90 placeholder-white/40 bg-transparent border-none focus:ring-0 focus:outline-none font-light"
                            />
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none select-none">
                                <div class="flex items-center gap-2">
                                    <code class="px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/5 text-[10px]">
                                        CMD + K
                                    </code>
                                    <span class="text-white/50 text-xs font-mono">to toggle</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <ul
                    ref={listRef}
                    class="flex-1 divide-y text-sm overflow-y-auto relative hide-scrollbar"
                    onScroll={onScroll}
                >
                    <div
                        style={{
                            height: `${filteredChannels().length * ROW_HEIGHT}px`,
                            position: "relative",
                            width: "100%"
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${offsetY()}px)`,
                                "will-change": "transform"
                            }}
                        >
                            <For each={visibleItems()}>
                                {(item, i) => (
                                    <ListItem
                                        item={item}
                                        index={() => visibleRange()[0] + i()}
                                        selectedIndex={selectedIndex}
                                        setSelectedIndex={setSelectedIndex}
                                        activeID={activeID}
                                        changeChannelDecorator={changeChannelDecorator}
                                    />
                                )}
                            </For>
                        </div>
                    </div>
                </ul>
                <div class="flex w-full items-center justify-between px-3 py-2 border-t border-white/10 text-xs shrink-0 font-mono">
                    <span classList={{
                        "text-emerald-500/80": filteredChannels().length > 0,
                        "text-red-500/80": filteredChannels().length == 0
                    }}>
                        {filteredChannels().length} <span class="text-white/30">Channel{filteredChannels().length == 1 ? "" : "s"}</span>
                    </span>

                    <div class="flex items-center gap-2">
                        <code class="px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/5 text-[10px]">
                            ESC
                        </code>
                        <span class="text-white/50 font-mono">to close</span>
                    </div>
                </div>
            </div>
        </Portal>
    );
}

export default Navigator;