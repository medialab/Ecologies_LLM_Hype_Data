<script>
    import { onMount } from "svelte";
    import { slide, scale, fade } from "svelte/transition";
    import { bounceIn, bounceOut } from "svelte/easing";
    import { syncedCurrentIndex, isPlaying, dataSet, isShowcasePlaying } from "$lib/stores/stores";
    import { get } from "svelte/store";

    
    let audioElement;
    let scrollContainer;
    let currentQuoteIndex = -1;

    // Track any ongoing scroll animation to avoid overlapping animations
    let scrollAnimationId = null;

    // For drift debugging
    let lastSegmentIndex = -1;
    let lastSegmentStartTime = 0;
    let rafId = null;
    let pausedForQuote = false;

    // High-resolution sync loop
    function startSyncLoop() {
        if (rafId || !audioElement) return;
        const loop = () => {
            if (!$isPlaying) { rafId = null; return; }
            const currentTime = audioElement.currentTime * 1000;
            evaluateCurrentTime(currentTime);
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
    }

    function stopSyncLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function evaluateCurrentTime(currentTime) {
        // Find the current segment based on the pre-computed timestamps
        let foundIndex = -1;
        for (let i = 0; i < segmentStartTimes.length; i++) {
            const start = segmentStartTimes[i];
            const segObj = $dataSet[i];
            const end   = segObj.end !== undefined ? segObj.end : start + segObj.duration;
            if (currentTime >= start && currentTime < end) {
                foundIndex = i;

                if (!pausedForQuote && segObj.type === 'quote' && (end - currentTime) <= 10) {
                    pausedForQuote = true;
                    isPlaying.set(false);
                    audioElement.pause();
                    stopSyncLoop();
                }
                break;
            }
        }

        if (foundIndex === -1) return;

        
        if (foundIndex !== lastSegmentIndex) {
            if (lastSegmentIndex !== -1) {
                const actualDuration = currentTime - lastSegmentStartTime;
                const seg = $dataSet[lastSegmentIndex];
                const expectedDuration = seg.end !== undefined ? seg.end - seg.start : seg.duration;
                const durationDrift = actualDuration - expectedDuration;
                //console.log(`SEGMENT END   >> ${lastSegmentIndex} at ${(currentTime/1000).toFixed(2)}s (audio)` +
                 //           ` | actual ${actualDuration.toFixed(0)}ms vs expected ${expectedDuration}ms -> drift ${durationDrift >= 0 ? '+' : ''}${durationDrift.toFixed(0)}ms`);
            }

            const jsonStart = segmentStartTimes[foundIndex];
            const startDrift = currentTime - jsonStart;
            //console.log(`SEGMENT START >> ${foundIndex} at ${(currentTime/1000).toFixed(2)}s (audio)` +
            //            ` | expected ${(jsonStart/1000).toFixed(2)}s -> drift ${startDrift >= 0 ? '+' : ''}${startDrift.toFixed(0)}ms`);

            lastSegmentIndex = foundIndex;
            lastSegmentStartTime = currentTime;
        }

        syncedCurrentIndex.set(foundIndex);
    }

    // Pre-compute segment start times (prefer absolute "start" field if present)
    let segmentStartTimes = [];
    $: if (segmentStartTimes.length === 0 && $dataSet.length) {
        if ($dataSet[0] && $dataSet[0].start !== undefined) {
            segmentStartTimes = $dataSet.map(seg => seg.start);
        } else {
            // Fallback for legacy datasets without "start" field
            let cumulative = 0;
            segmentStartTimes = $dataSet.map(seg => {
                const start = cumulative;
                cumulative += seg.duration;
                return start;
            });
        }
    }

    
    $: if ($syncedCurrentIndex > -1) {
        const spanElement = document.getElementById(`sub_text_${$syncedCurrentIndex}`);
        if(spanElement) {
            animatedScrollTo(spanElement);
        }
    }

    $: if (pausedForQuote && !$isShowcasePlaying) {
        pausedForQuote = false;
        if (audioElement && audioElement.paused) {
            isPlaying.set(true);
            audioElement.play();
            startSyncLoop();
        }
    }

    const animatedScrollTo = (element, duration = 1000) => {
        if (!element || !scrollContainer) return;
        
        // Cancel any in-flight animation before starting a new one
        if (scrollAnimationId) {
            cancelAnimationFrame(scrollAnimationId);
            scrollAnimationId = null;
        }

        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        const startScrollTop = scrollContainer.scrollTop;
        const targetScrollTop = startScrollTop + elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
        
        const startTime = performance.now();
        
        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easeInOut;
            scrollContainer.scrollTop = currentScrollTop;
            
            if (progress < 1 && duration > 0) {
                scrollAnimationId = requestAnimationFrame(animateScroll);
            } else if (duration === 0) {
                scrollContainer.scrollTop = targetScrollTop;
                scrollAnimationId = null;
            }
        };
        
        scrollAnimationId = requestAnimationFrame(animateScroll);
    };

    const startPlayback = () => {
        isPlaying.set(true);
        if (audioElement) {
            audioElement.play();
            startSyncLoop();
        }
    };

    const resetCycle = () => {
        isPlaying.set(false);
        stopSyncLoop();
        isShowcasePlaying.set(false);

        pausedForQuote = false;

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }

        syncedCurrentIndex.set(-1);
        currentQuoteIndex = -1;
    };

    onMount(() => {
        isPlaying.set(false);
        console.log("isPlaying", $isPlaying);
    });
</script>


<div class="subtitle_container" bind:this={scrollContainer}>
    <div class="sub_text_container">
        
        <p class="sub_text" >
            {#each $dataSet as segment, index}
                <span id={`sub_text_${index}`}
                class={index === $syncedCurrentIndex ? 'currentSpan' : index === $syncedCurrentIndex + 1 ? 'nextSpan' : index === $syncedCurrentIndex - 1 ? 'prevSpan' : ''}>
                    {@html segment.text}
                </span>&nbsp;
            {/each}
        </p>
        
    </div>
</div>

<div class="button_container">
    <button onclick={startPlayback}>
        <p class="button_text" style="pointer-events: {$isPlaying ? 'none' : 'auto'};">
            Start
        </p>
    </button>

    <button onclick={resetCycle}>
        <p class="button_text" >
            Reset
        </p>
    </button>
</div>


<audio bind:this={audioElement} src="/narratio.mp3" playsinline onended={() => { isPlaying.set(false); stopSyncLoop(); }}>
</audio>



<style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap');

    :global(*) {
        font-family: "Instrument Sans";
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    :global(body) {
        box-sizing: border-box;
        border-radius: 30px;
        background-color: rgba(0, 0, 0, 1);
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .button_container {
        position: fixed;
        z-index: 2;
        padding: 20px;
        border-radius: 10px;
        bottom: 30%;
        left: 50%;
        transform: translate(-50%, 0%);
    }

    button {
        background-color: rgb(0, 0, 0);
        border: 1px solid rgb(255, 255, 255);
        padding: 10px 20px;
        border-radius: 30px;
        color: white;
        transform: scale(1);
        transition: all 0.1s ease-in-out;
    }


    .button_text {
        font-size: 1.1rem;
        font-weight: 400;
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
        gap: 50px;
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
        font-size: 1.2rem;
        text-justify: distribute-all-lines;
        text-align: justify;
        color: rgba(255, 255, 255, 0);
        font-weight: 400;
    }

    

    .sub_text_container {
        display: flex;
        flex-direction: column;
        gap: 5px;
        justify-content: flex-start;
        align-items: flex-start;
        padding-top: 100px;
        height: 100%;
    }

    ::-webkit-scrollbar {
        display: none;
    }

    :global(.sub_text > span) {
        color: rgba(255, 255, 255, 0);
        filter: blur(3px);
        transition: all 2s ease-in-out;
    }

    :global(span.prevSpan) {
        color: rgba(255, 255, 255, 0.2);
        filter: blur(3px);
    } 

    :global(span.nextSpan) {
        color: rgba(255, 255, 255, 0.2);
        filter: blur(3px);

    }   

    :global(span.currentSpan) {
        color: rgba(255, 255, 255, 1);
        filter: blur(0px);

    }

    

    
</style>