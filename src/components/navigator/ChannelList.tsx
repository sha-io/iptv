import { For, createSignal, createMemo, type Accessor, onMount, onCleanup, createEffect } from "solid-js";
import Channel from "./Channel";
import type { M3UChannel } from "@libs/m3u";
import useListNavigator from "./useListNavigator";

const { min, max, ceil, floor } = Math;

interface ChannelListProps {
    cellHeight: number;
    overscan?: number;
    height: number;
    ref?: (el: HTMLUListElement) => void;
    channels: Accessor<M3UChannel[]>;
    onChannelSelect: (channel: M3UChannel) => void;
}

const DEFAULT_OVERSCAN = 50;

function ChannelList(props: ChannelListProps) {
    const overscan = () => props.overscan ?? DEFAULT_OVERSCAN;
    const [scrollTop, setScrollTop] = createSignal(0);
    const [viewportHeight, setViewportHeight] = createSignal(0)
    const [highlighted, setHighlighted] = createSignal("");
    const [listRef, setListRef] = createSignal<HTMLUListElement | undefined>(undefined)
    const { focus, setFocus, move } = useListNavigator(props.channels, props.cellHeight, scrollTop, setScrollTop, viewportHeight)

    /* Start by getting how many items are on the screen */
    const getDisplayBounds = createMemo<[number, number]>(() => {
        const start = floor(scrollTop() / props.cellHeight);
        const visibleCount = ceil(props.height / props.cellHeight);

        const from = max(0, start - overscan());
        const to = min(props.channels().length, start + visibleCount + overscan());

        return [from, to];
    });

    /* Using the number of visible pixels, calculate show a slice of the channels to represent that */
    const getVisibleChannels = createMemo(() => {
        const [from, to] = getDisplayBounds();
        return props.channels().slice(from, to);
    });

    const offsetY = createMemo(() => getDisplayBounds()[0] * props.cellHeight);

    const channelClickController = (channel: M3UChannel) => {
        props.onChannelSelect(channel)
        setHighlighted(channel.url)
    }

    const channelFocusController = (key: number) => setFocus(key)
    const keyboardController = (e: KeyboardEvent) => {
        switch (e.code) {
            case "ArrowDown":
                e.preventDefault();
                move(1);
                break;

            case "ArrowUp":
                e.preventDefault();
                move(-1);
                break;
        }
    };

    createEffect(() => {
        const el = listRef();
        if (!el) return;

        const next = scrollTop();
        el.scrollTop = next
    });

    onMount(() => {
        const el = listRef();
        if (el) setViewportHeight(el.clientHeight);
        window.addEventListener("keydown", keyboardController)
    })

    onCleanup(() => {
        window.removeEventListener("keydown", keyboardController)
    })

    return (
        <ul
            ref={el => {
                props.ref?.(el)
                setListRef(el)
            }}
            class="flex-1 divide-y text-sm overflow-y-auto relative hide-scrollbar"
            style={{ height: `${props.height}px` }}
            onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        >
            <div
                style={{
                    height: `${props.channels().length * props.cellHeight}px`,
                    position: "relative",
                    width: "100%",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${offsetY()}px)`,
                        "will-change": "transform",
                    }}
                >
                    <For each={getVisibleChannels()}>
                        {(item, i) => (
                            <Channel
                                id={item.url}
                                data={item}
                                key={i()}
                                height={props.cellHeight}
                                isHighlighted={() => highlighted() === item.url}
                                isFocused={() => focus() === i()}
                                onclick={channelClickController}
                                onmousemove={channelFocusController}
                            />
                        )}
                    </For>
                </div>
            </div>
        </ul>
    );
}

export default ChannelList;
