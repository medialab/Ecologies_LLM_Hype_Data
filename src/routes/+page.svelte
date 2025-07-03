<script>
    import { onMount } from "svelte";
    import { slide, scale, fade } from "svelte/transition";
    import { bounceIn, bounceOut } from "svelte/easing";
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, subComplete } from "$lib/stores/stores";

    
    let timeouts = [];
    let audioElement;
    let scrollContainer;

    const parseTime = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':');
        const [secs, millisecs] = seconds.split('.');
        return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs)) * 1000 + parseInt(millisecs);
    };

    const animatedScrollTo = (element, duration = 500) => {
        if (!element || !scrollContainer) return;
        
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const startScrollTop = scrollContainer.scrollTop;
        const targetScrollTop = startScrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
        
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeInOut;
            scrollContainer.scrollTop = currentScrollTop;
            
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };
        
        requestAnimationFrame(animateScroll);
    };

    const updateSpans = ($syncedCurrentIndex) => {

        let prevSpanElement = null;
        let spanElement = document.getElementById(`sub_text_${$syncedCurrentIndex}`);
        let nextSpanElement = document.getElementById(`sub_text_${$syncedCurrentIndex + 1}`);

        if ($syncedCurrentIndex !== 0) {
            prevSpanElement = document.getElementById(`sub_text_${$syncedCurrentIndex - 1}`);
        } else {
            prevSpanElement = document.getElementById(`sub_text_${$syncedCurrentIndex}`);
        }


        if ($syncedCurrentIndex !== 0) {
            prevSpan.set(prevSpanElement);

            if (prevSpanElement) {
                $prevSpan.style.color = "rgba(0, 0, 0, 0.2)";
                $prevSpan.style.filter = "blur(0px)";
                $prevSpan.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%);";
            }
        }

        if (spanElement) {
            currentSpan.set(spanElement);
            animatedScrollTo(spanElement, 600);
            $currentSpan.style.color = "rgba(0, 0, 0, 1)";
            $currentSpan.style.filter = "blur(0px)";
        }
        
        if (nextSpanElement) {
            nextSpan.set(nextSpanElement);

            $nextSpan.style.filter = "blur(1px)";;
            $nextSpan.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%);";
            
            setTimeout(() => {
                $nextSpan.style.color = "rgba(0, 0, 0, 0.2)"
                $nextSpan.style.clipPath = "polygon(0 0, 100% 0, 100% 100%, 0% 100%);";
            }, 100);
        }

    }

    const startSubtitleCycle = () => {

        if (audioElement) {
        console.log("Playing audio");
        audioElement.currentTime = 0;
        audioElement.play();
        }

        $subComplete.forEach((sub, index) => {
            if ($isPlaying) {
                const startTime = parseTime(sub.start);
                const endTime = parseTime(sub.end);
                
                const showTimeout = setTimeout(() => {
                    
                    syncedCurrentIndex.set(index);
                    updateSpans($syncedCurrentIndex);
                    
                }, startTime);
                
                timeouts.push(showTimeout);
                }
        });  
    }

    const resetCycle = () => {
        isPlaying.set(false);

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            audioElement.pause();
        }

        timeouts.forEach(timeout => clearTimeout(timeout));
        timeouts = [];
        syncedCurrentIndex.set(0);
    };

    onMount(() => {
        isPlaying.set(false);
        console.log("isPlaying", $isPlaying);
    });
</script>


    <div class="subtitle_container" bind:this={scrollContainer}>
        <div class="sub_text_container">
            
        <p class="sub_text" >{#each $subComplete as sub, index}
            <span id={`sub_text_${index}`}>{@html sub.text}</span>&nbsp;
            {/each}
        </p>
           
        </div>
    </div>

<audio bind:this={audioElement} src="/audio.wav" playsinline>
</audio>

<div class="button_container">
    <button onclick={() => {
        isPlaying.set(true);
        startSubtitleCycle();
    }} style="background-color: {$isPlaying ? 'red' : 'white'};">
        <p class="button_text" style="pointer-events: {$isPlaying ? 'none' : 'auto'};">
            Start
        </p>
    </button>

    <button onclick={resetCycle} style="background-color: {$isPlaying ? 'white' : 'white'};">
        <p class="button_text" >
            Reset
        </p>
    </button>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap');

    * {
        font-family: "Instrument Sans";
        margin: 0;
        padding: 0;
    }

    :global(body) {
        border: 20px solid black;
        box-sizing: border-box;
        border-radius: 30px;
        background-color: rgba(255, 255, 255, 0.1);
        width: 100%;
        height: 100%;
    }

    .button_container {
        position: absolute;
        bottom: 0%;
        left: 50%;
        transform: translate(-50%, -4%);
        z-index: 100;
        padding: 20px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 1);
    }

    button {
        background-color: rgb(231, 231, 231);
        border: 1px solid black;
        padding: 10px 20px;
        border-radius: 10px;
        background-color: rgba(0, 0, 0, 0.1);
        transform: scale(1);
        transition: all 0.1s ease-in-out;
    }

    .button:active {
        background-color: rgba(0, 0, 0, 0.2);
        transform: scale(0.95);
        transition: all 0.1s ease-in-out;
    }

    .button_text {
        font-size: 1.1rem;
        font-weight: 400;
        color: black;
    }

    :global(html, body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
        width: 100%;
        height: 100%;
    }

    .subtitle_container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        height: 300px;
        background-color: transparent;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 5px;
        overflow: scroll;
        mask: 
            linear-gradient(to bottom, transparent 0%, black 50%) top,
            linear-gradient(to top, transparent 0%, black 50%) bottom;
        mask-size: 100% 50%, 100% 50%;
        mask-repeat: no-repeat;
        scrollbar-width: none;
        -ms-overflow-style: none;
    }

    .sub_text {
        font-family: "Instrument Sans";
        font-size: 1.5rem;
        text-justify: distribute-all-lines;
        text-align: justify;
        color: rgba(0, 0, 0, 0);
        font-weight: 700;
    }

    :global(.sub_text > span) {
        transition: all 2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sub_text_container {
        display: flex;
        flex-direction: column;
        gap: 5px;
        justify-content: flex-start;
        align-items: flex-start;
        padding-top: 100px;
    }

    ::-webkit-scrollbar {
        display: none;
    }

    

    
</style>