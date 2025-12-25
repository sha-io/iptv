import { splitProps } from "solid-js"

interface CommandBlockProps {
    text: string;
    label: string;
}

function KeyHint(props: CommandBlockProps) {
    const [{ text, label }] = splitProps(props, ["text", "label"])
    return (
        <div class="flex items-center gap-2">
            <code class="px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/5 
             shadow-[0_2px_0_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.5)] text-[10px]">
                {text}
            </code>
            <span class="text-white/50 font-mono text-xs">{label}</span>
        </div>
    )
}

export default KeyHint