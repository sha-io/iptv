import Play from "../assets/play.svg"
import Pause from "../assets/pause.svg"
import Loading from "../assets/loading.svg"

import { createEffect, createSignal, onCleanup, splitProps } from "solid-js"
import Hls from "hls.js"

interface VideoProps {
    src: string
    logo?: string
    ref?: (el: HTMLElement | undefined) => void
}

export default function Video(props: VideoProps) {
    let video: HTMLVideoElement | undefined
    let hls: Hls | undefined
    let overlayTimeout: number
    let clickTimeout: number | null = null

    let prevent = false
    const DOUBLE_CLICK_DELAY = 150

    const [state] = splitProps(props, ["src", "logo", "ref"])
    const [isPlaying, setIsPlaying] = createSignal(false)
    const [isHovering, setIsHovering] = createSignal(false)
    const [loading, setLoading] = createSignal(false)
    const [, setContainerRef] = createSignal<HTMLElement | undefined>(undefined)

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
        const source = state.src
        if (!source || !Hls.isSupported() || !video) return
        const videoOptions = {
            maxBufferLength: 10,
            maxMaxBufferLength: 15,
            maxBufferSize: 20 * 1000 * 1000,
            backBufferLength: 10,

            liveSyncDuration: 3,
            liveMaxLatencyDuration: 10,
            liveDurationInfinity: true,
            lowLatencyMode: true,


            startPosition: -1,
            enableWorker: true,

            abrEwmaFastLive: 3,
            abrEwmaSlowLive: 9,
            abrBandWidthFactor: 0.8,
            abrBandWidthUpFactor: 0.7,

            fragLoadingTimeOut: 20000,
            fragLoadingMaxRetry: 6,
            fragLoadingRetryDelay: 1000,
            fragLoadingMaxRetryTimeout: 64000,

            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 6,

            progressive: true
        }
        if (!hls) {
            hls = new Hls(videoOptions);

            hls.attachMedia(video)
        }

        hls.loadSource(state.src)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (isPlaying()) video.play()
        })

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Network error, trying to recover...');
                        hls?.startLoad();
                        break;

                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Media error, attempting recovery...');
                        hls?.recoverMediaError();
                        break;

                    default:
                        console.log('Unrecoverable error, destroying HLS instance...');
                        hls?.destroy();
                        break;
                }
            }
        });


    })

    onCleanup(() => {
        hls?.destroy()
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
                        {loading() ? <img src={Loading} class="size-10 animate-spin" /> : <img
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
