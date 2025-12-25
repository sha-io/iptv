import type { M3UChannel } from "@libs/m3u";
import { type Accessor, createSignal, createEffect, createMemo, type Setter } from "solid-js";

function useListNavigator(list: Accessor<M3UChannel[]>, rowHeight: number, scrollTop: Accessor<number>, setScrollTop: Setter<number>, height: Accessor<number>) {
    const [focus, setFocus] = createSignal(0);
    const len = createMemo(() => list().length);

    const scrollTo = (index: number) => {
        const current = scrollTop();
        const top = index * rowHeight;
        const bottom = top + rowHeight;

        if (top < current) {
            setScrollTop(top);
        } else if (bottom > current + height()) {
            setScrollTop(bottom - height());
        }
    };

    const move = (shift: number) => {
        setFocus(prev => {
            if (len() === 0) return -1;
            const next = Math.max(0, Math.min(prev + shift, len() - 1));
            scrollTo(next);
            return next;
        });
    };

    createEffect(() => {
        if (len() === 0) return
        setFocus(0);
        setScrollTop(0)
    });

    return {
        focus,
        setFocus,
        move
    }
}

export default useListNavigator