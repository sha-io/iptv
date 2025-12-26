import Play from "../../assets/play.svg"
import Pause from "../../assets/pause.svg"
import Loading from "../../assets/loading.svg"

import { createEffect, createSignal, onCleanup, splitProps } from "solid-js"
import Hls from "hls.js"
import useVideoPlayer from "./useVideoPlayer"

interface VideoProps {
    src: string
    logo?: string
    ref?: (el: HTMLElement | undefined) => void
}

export default function Video(props: VideoProps) {
    let video: HTMLVideoElement | undefined
    let overlayTimeout: number
    let clickTimeout: number | null = null

    let prevent = false
    const DOUBLE_CLICK_DELAY = 150

    const [state] = splitProps(props, ["src", "logo", "ref"])
    const [src, setSrc] = createSignal(state.src)
    const [isPlaying, setIsPlaying] = createSignal(false)
    const [isHovering, setIsHovering] = createSignal(false)
    const [loading, setLoading] = createSignal(false)
    const [containerRef, setContainerRef] = createSignal<HTMLElement | undefined>(undefined)

    const handleClick = () => {
        if (clickTimeout !== null) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
            prevent = true
            toggleFullScreen();
        } else {
            clickTimeout = setTimeout(() => {
                if (!prevent) togglePlay();
                clickTimeout = null;
                prevent = false
            }, DOUBLE_CLICK_DELAY);
        }
    };

    const togglePlay = () => {
        video?.paused ? video?.play() : video?.pause()
        setIsPlaying(!isPlaying())
    }

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.getElementById("video-container")?.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const keyboardController = (e: KeyboardEvent) => {
        const key = e.code
        switch (key) {
            case "Space":
                togglePlay()
                break
            case "KeyF":
                toggleFullScreen()
                break;
            default:
                break
        }
    }

    const showOverlay = () => {
        if (!isHovering()) {
            clearTimeout(overlayTimeout)
            setIsHovering(true)
            overlayTimeout = setTimeout(() => setIsHovering(false), 1325)
        }
    }

    const clearOverlay = () => {
        clearTimeout(overlayTimeout)
        setIsHovering(false)
    }

    createEffect(() => {
        setSrc(state.src);
    });

    createEffect(() => {
        if (!Hls.isSupported() || !video || !src()) return

        const { client } = useVideoPlayer(video, src)
        client.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play()
            setIsPlaying(true)
        })

    })

    return (
        <section
            ref={el => {
                setContainerRef(el)
                state.ref?.(el)
            }}
            id="video-container"
            tabindex={0}
            onkeydown={keyboardController}
            onclick={handleClick}
            ondblclick={handleClick}
            class="w-screen h-screen bg-black relative">
            <video
                ref={video}
                id="video"
                onwaiting={() => setLoading(true)}
                onplaying={() => setLoading(false)}
                src={state.src}
                class="w-full h-full aspect-video" />
            <div
                classList={{ "opacity-0": isPlaying(), "opacity-100": isHovering() || loading() }}
                class="bg-black/50 select-none transition-all duration-500 absolute top-0 left-0 py-8 px-8 z-10 flex justify-between items-end w-full h-full"
                onmousemove={showOverlay}
                onmouseleave={clearOverlay}>
                <div class="flex justify-between w-full">
                    <span class="inline-flex items-center">
                        {loading() ?
                            <img src={Loading} class="size-10 animate-spin" />
                            :
                            <img
                                onclick={e => {
                                    e.stopPropagation()
                                    togglePlay()
                                }}
                                src={isPlaying() ? Pause : Play}
                                alt={isPlaying() ? "play-button" : "pause-button"}
                                class="size-10 cursor-pointer"
                            />}
                    </span>
                    <span class="size-15 inline-flex items-end self-end justify-end">
                        {state.logo && <img src={state.logo} alt="channel-logo" class="w-full h-full object-contain inline-flex items-end justify-end" />}
                    </span>
                </div>
            </div>
        </section>
    )
}
