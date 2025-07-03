<script>
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { slide, scale } from "svelte/transition";
    import { bounceIn, bounceOut } from "svelte/easing";

    const shownText = writable("");
    import subComplete from "$lib/media/sample.json";

    let currentIndex = 0;
    let timeouts = [];
    let audioElement;

    const parseTime = (timeString) => {
        const [hours, minutes, seconds] = timeString.split(':');
        const [secs, millisecs] = seconds.split('.');
        return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs)) * 1000 + parseInt(millisecs);
    };

    const startSubtitleCycle = () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
            timeouts = [];
            currentIndex = 0;

            if (audioElement) {
                console.log("Playing audio");
                audioElement.currentTime = 0;
                audioElement.play();
            }

        subComplete.forEach((sub, index) => {
            const startTime = parseTime(sub.start);
            const endTime = parseTime(sub.end);
            
            const showTimeout = setTimeout(() => {
                currentIndex = index;
                shownText.set(sub.text);
                console.log(sub.text);
            }, startTime);
            
            timeouts.push(showTimeout);
        });
    };

    const resetCycle = () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
        timeouts = [];
        currentIndex = 0;
        shownText.set("");
        startSubtitleCycle();
    };

    onMount(() => {
        
        return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
        };
    });
</script>

{#key $shownText}
<div class="subtitle_container"
                in:scale={{ duration: 100, easing: bounceIn, scale: 1.1 }}
                out:scale={{ duration: 100, easing: bounceOut, scale: 0.9 }}>
  <div class="sub_text_container">
            <p class="sub_text">{$shownText}</p>
  </div>
</div>
{/key}

<audio bind:this={audioElement} src="/audio.wav" playsinline>
</audio>

<button onclick={startSubtitleCycle}>
    Start
</button>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap');

    * {
        font-family: "Instrument Sans";
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
        height: 200px;
        background-color: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .sub_text {
        font-family: "Instrument Sans";
        color: black;
        font-size: 1.5rem;
    }

    
</style>