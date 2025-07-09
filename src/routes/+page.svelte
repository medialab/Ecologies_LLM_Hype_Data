<script>
    import { onMount } from "svelte";
    import { slide, scale, fade } from "svelte/transition";
    import { bounceIn, bounceOut } from "svelte/easing";
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, dataSet, isShowcasePlaying } from "$lib/stores/stores";

    
    let timeouts = [];
    let audioElement;
    let scrollContainer;
    let lastStartTime = 0;

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

    const waitForShowcaseEnd = () => {
        return new Promise((resolve) => {
            const unsubscribe = isShowcasePlaying.subscribe(value => {
                if (value === false) {
                    unsubscribe();
                    resolve();
                }
            });
        });
    };


    const updateSpans = ($syncedCurrentIndex) => {
        if ($syncedCurrentIndex < 0) return;

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
                $prevSpan.style.color = "rgba(255, 255, 255, 0.2)";
                $prevSpan.style.filter = "blur(3px)";
            }
        }

        if (spanElement) {
            currentSpan.set(spanElement);
            animatedScrollTo(spanElement, 600);
            $currentSpan.style.color = "rgba(255, 255, 255, 1)";
            $currentSpan.style.filter = "blur(0px)";
        }
        
        if (nextSpanElement) {
            nextSpan.set(nextSpanElement);

            $nextSpan.style.filter = "blur(1px)";

            
            setTimeout(() => {
                $nextSpan.style.color = "rgba(255, 255, 255, 0.2)"

            }, 100);
        }

    }

    const startSubtitleCycle = () => {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }

        const scheduleNext = async (index) => {
            if (!$isPlaying) return;

            const sub = $dataSet[index];
            if (!sub) return;
            
            const startTime = parseTime(sub.start);
            const delay = startTime - lastStartTime;
            
            const timeout = setTimeout(async () => {
                if ($isShowcasePlaying === true) {
                    await waitForShowcaseEnd();
                    scheduleNext(index + 1);
                } else {
                    syncedCurrentIndex.set(index);
                    updateSpans($syncedCurrentIndex);
                    lastStartTime = startTime;
                    scheduleNext(index + 1);
                }
            }, delay);
            
            timeouts.push(timeout);
        };

        scheduleNext(0);
    }

    const resetCycle = () => {
        isPlaying.set(false);
        isShowcasePlaying.set(false);

        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }

        timeouts.forEach(timeout => {
            clearTimeout(timeout);
            clearInterval(timeout);
        });
        timeouts = [];
        syncedCurrentIndex.set(-1);
    };

    const setPosition = (index, containerWidth = 300, containerHeight = 230) => {
        const padding = 40;
        
        // Create a more distributed initial positioning using a grid-like approach
        const cols = Math.ceil(Math.sqrt(index + 1));
        const rows = Math.ceil((index + 1) / cols);
        
        const gridX = (index % cols) / Math.max(1, cols - 1);
        const gridY = Math.floor(index / cols) / Math.max(1, rows - 1);
        
        // Add some randomness to break the perfect grid
        const randomOffsetX = (Math.random() - 0.5) * 200;
        const randomOffsetY = (Math.random() - 0.5) * 200;
        
        const x = (gridX * (window.innerWidth - containerWidth - padding * 2)) + padding + randomOffsetX;
        const y = (gridY * (window.innerHeight - containerHeight - padding * 2)) + padding + randomOffsetY;
        
        // Ensure bounds
        const boundedX = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, x));
        const boundedY = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, y));
        
        // Set z-index based on index, ensuring index 0 has good visibility
        const z = index === 0 ? 50 : index + 1;

        // Adjust scale calculation to ensure good visibility for index 0
        const baseScale = 0.5;
        const scaleMultiplier = 0.8;
        const objectDistance = baseScale + (z/50) * scaleMultiplier;
        
        return { x: boundedX, y: boundedY, z, objectDistance };
    };

    onMount(() => {
        isPlaying.set(false);
        console.log("isPlaying", $isPlaying);
    });
</script>


<div class="subtitle_container" bind:this={scrollContainer}>
    <div class="sub_text_container">
        
        <p class="sub_text" >{#each $dataSet as sub, index}
            <span id={`sub_text_${index}`}>{@html sub.text}</span>&nbsp;
            {/each}
        </p>
        
    </div>
</div>

<div class="button_container">
    <button onclick={() => {
        isPlaying.set(true);
        startSubtitleCycle();
    }}>
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


<audio bind:this={audioElement} src="/narratio.mp3" playsinline>
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
        font-size: 2rem;
        text-justify: distribute-all-lines;
        text-align: justify;
        color: rgba(255, 255, 255, 0);
        font-weight: 400;
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
        height: 100%;
    }

    ::-webkit-scrollbar {
        display: none;
    }

    

    
</style>