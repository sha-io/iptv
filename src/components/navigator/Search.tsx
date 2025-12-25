import KeyHint from "src/ui/KeyHint";

interface SearchProps {
    oninput: (e: HTMLInputElement) => void;
    ref?: (el: HTMLInputElement) => void
}

function Search(props: SearchProps) {
    return (
        <form class="border-b border-white/20 w-full shrink-0">
            <div class="relative">
                <div class="relative w-full">
                    <input
                        ref={props.ref}
                        oninput={(e) => props.oninput(e.currentTarget)}
                        type="text"
                        placeholder="Search channels..."
                        spellcheck="false"
                        autocomplete="off"

                        class="w-full h-14 pl-4 pr-24 text-white/90 placeholder-white/40 bg-transparent border-none focus:ring-0 focus:outline-none font-light"
                    />
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none select-none">
                        <div class="flex items-center gap-2">
                            <KeyHint text="CMD + K" label="to toggle" />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}

export default Search