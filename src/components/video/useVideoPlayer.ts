import Hls, { type HlsConfig } from "hls.js";
import type { Accessor } from "solid-js";

const defaultOptions: Partial<HlsConfig> = {
    maxBufferLength: 60,
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
};

type VideoPlayerApi = {
    readonly client: Hls;
    destroy: () => void;
};

export default function useVideoPlayer(video: HTMLVideoElement, src: Accessor<string>, options?: Partial<HlsConfig>): VideoPlayerApi {
    const hls = new Hls({ ...defaultOptions, ...options });

    hls.attachMedia(video);
    hls.loadSource(src());

    hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("[HLS ERROR]", data);

        if (!data.fatal) return;

        switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn("[HLS] Network error — retrying");
                hls.startLoad();
                break;

            case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn("[HLS] Media error — recovering");
                hls.recoverMediaError();
                break;

            default:
                console.error("[HLS] Fatal error — destroying");
                hls.destroy();
                break;
        }
    });

    function destroy() {
        console.log("[HLS] Destroying instance");
        hls.destroy();
    }

    return {
        client: hls,
        destroy
    };
}
