<script>
    import { onMount, onDestroy } from "svelte";
    import { slide, scale, fade } from "svelte/transition";
    import { bounceIn, bounceOut } from "svelte/easing";
    import { syncedCurrentIndex, isPlaying, dataSet, isShowcasePlaying, currentTimestamp } from "$lib/stores/stores";
    import { get } from "svelte/store";
    import { Tween } from "svelte/motion";
    import { cubicIn } from "svelte/easing";
    import { writable } from "svelte/store";

    
    let audioElement;
    let scrollContainer;
    let currentQuoteIndex = -1;
    let scrollAnimationId = null;

    let lastSegmentIndex = -1;
    let lastSegmentStartTime = 0;
    let rafId = null;
    let pausedForQuote = false;

    let audioCurrentTime = writable(null);
    let audioDuration = writable(null);

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

            // Adjust audio volume based on segment type
            const currentSeg = $dataSet[foundIndex];
            if (audioElement) {
                audioElement.volume = currentSeg.type === 'quote' ? 0.5 : 1;
            }

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
        console.log("audioCurrentTime", $audioCurrentTime);
        console.log("audioDuration", $audioDuration);

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

    let audioCtx;
    let sourceNode;
    let pannerNode;

    $: if (audioElement && typeof window !== 'undefined') {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            sourceNode = audioCtx.createMediaElementSource(audioElement);
            pannerNode = audioCtx.createStereoPanner();
            sourceNode.connect(pannerNode).connect(audioCtx.destination);
        }
    }

    $: if (pannerNode && typeof $isShowcasePlaying !== 'undefined') {
        pannerNode.pan.value = $isShowcasePlaying ? -1 : 0;
    }

    $: if (audioElement) {
        console.log("audioCurrentTime", audioElement.currentTime);
        console.log("audioDuration", audioElement.duration);
    }

    onMount(() => {
        isPlaying.set(false);
        audioElement.volume = 0;
        console.log("isPlaying", $isPlaying);
        // Resume audio context on user gesture if needed
 
    });
</script>

<div class="scroller_container">
    <div class="grid_console">
        <div class="grid_console_header">
            <p>
                Narrator_debug.wav
            </p>
        </div>
    </div>
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
        <button onclick={startPlayback}
        class:isPlaying={!$isPlaying}>

        <p class="button_text" >
                ▶︎
            </p>
        </button>

        <progress class="progress_bar" value={$audioCurrentTime || 0} max={$audioDuration || 100}></progress>
    
        <button onclick={resetCycle}
        class:isPlaying={$isPlaying}>
            <p class="button_text" style="white-space: nowrap;">
                ◼︎
            </p>
        </button>
    </div>
</div>






<audio bind:this={audioElement} src="/narratio_debug.wav" playsinline 
    onended={() => { isPlaying.set(false); stopSyncLoop(); }}
    ontimeupdate={() => audioCurrentTime.set(audioElement.currentTime)}
    onloadedmetadata={() => audioDuration.set(audioElement.duration)}>
</audio>



<style>
   
    .button_container {
        z-index: 2;
        padding-top: 20px;
        border-radius: 10px;
        grid-column: 4 / 9;
        grid-row: 8;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }

    

    progress {
        width: 100%;
        height: 10px;
        border-radius: 12px;
        border: none;
        overflow: hidden;
        backdrop-filter: blur(10px);
    }
    progress::-webkit-progress-bar {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        border: 1px solid #ffffff;
        filter: blur(1px);
        
    }
    progress::-webkit-progress-value {
        background-color: #ffffff;
        border-radius: 12px;
        transition: width 0.3s;
    }
    progress::-moz-progress-bar {
        background-color: #76b900;
        border-radius: 12px;
        transition: width 0.3s;
    }

    button {
        background-color: rgb(255, 255, 255);
        border: 1px solid rgb(255, 255, 255);
        padding: 10px 20px;
        border-radius: 30px;
        color: #0059FF;
        transform: scale(1);
        transition: all 0.1s ease-in-out;
        transform-origin: center;
        will-change: transform;
        align-self: center;
        cursor: pointer;
        justify-content: center;
        pointer-events: none;
        opacity: 0.1;
        transition: all 0.3s ease-in-out;
    }

    button.isPlaying {
        opacity: 1;
        pointer-events: auto;
    }

    button:active {
        transform: scale(0.9);
        transition: all 0.3s ease-in-out;
    }

    button:hover {
        transform: scale(0.95);
        transition: all 0.3s ease-in-out;
    }


    .button_text {
        font-size: 1.1rem;
        font-weight: 400;
    }

    .scroller_container {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: repeat(11, 1fr);
		grid-template-rows: repeat(11, 1fr);
		padding: 20px;
		grid-gap: 20px;
	}

    .subtitle_container {
        grid-column: 4 / 9;
        grid-row: 4 / 9;
        background-color: transparent;
        display: flex;
        justify-content: center;
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
        z-index: 1;
    }

    .grid_console {
        grid-column: 4 / 9;
        grid-row: 4 / 9;
        border: 2px solid white;
        border-radius: 10px;
        background-color: rgba(255, 255, 255, 0.25);
        margin: -20px;
        z-index: 0;
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
    }

    .grid_console_header {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
        background-color: white;
        padding: 10px;
        border: 2px solid white;
        color: #0059FF;
    }

    .sub_text {
        font-family: "Instrument Sans";
        font-size: 1.6rem;
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