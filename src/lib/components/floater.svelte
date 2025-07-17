<script>
    import { syncedCurrentIndex, dataSet, entitiesLimit, syncedCurrentPeriod, isQuoteVideoPlaying } from "$lib/stores/stores";
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { fade } from "svelte/transition";
    import { Tween } from "svelte/motion";
    import { cubicIn } from "svelte/easing";
    import { tick } from "svelte";

    export let index;
    export let animatePosition;
    export let setPosition;

    export let media;
    export let mediaType;

    let x = 0;
    let y = 0;
    let z = 0;
    let thisFloater;
    let quoteVideo;
    let objectDistance = 0;
    let showFloater = writable(false);
    let floaterType = null;
    let isVisible = true;
    let videoFloater;

    $: isVisible = !(index < $syncedCurrentIndex-$entitiesLimit || index > $syncedCurrentIndex+$entitiesLimit);

    //Identify when we are showcasing a quote video
    $: if (quoteVideo && $dataSet[index].type === 'quote' && isVisible && index === $syncedCurrentIndex) {
        startQuoteVideoSync();
    }

    //Start video when it is showcased
    $: if (mediaType === 'video' && index === $syncedCurrentIndex && videoFloater) {
        videoFloater.currentTime = 0;
        videoFloater.play();
    } else if (mediaType === 'video' && index !== $syncedCurrentIndex && videoFloater) {
        videoFloater.pause();
    }

    function manageQuoteVideo() {
        if (quoteVideo) {
            quoteVideo.currentTime = 0;
            quoteVideo.volume = 1;
            quoteVideo.play();
        }
    }

    function startQuoteVideoSync() {
        if (!quoteVideo) {
            console.log("Quote video element not found");
            return;
        }

        quoteVideo.onplay = null;
        quoteVideo.onended = null;

        quoteVideo.onplay = () => {
            console.log("Quote video started playing");
            isQuoteVideoPlaying.set(true);
            console.log("isQuoteVideoPlaying: ", $isQuoteVideoPlaying);
        };
        
        quoteVideo.onended = () => {
            console.log("Quote video ended");
            isQuoteVideoPlaying.set(false);
            console.log("isQuoteVideoPlaying: ", $isQuoteVideoPlaying);
        };

        if (quoteVideo.paused) {
            console.log("Starting paused quote video");
            quoteVideo.play();
        } else {
            console.log("Quote video already playing");
        }
    }
     
    onMount( async () => {
        const position = setPosition(index);
        x = position.x;
        y = position.y;
        z = position.z;
        objectDistance = position.objectDistance;

        setTimeout(() => {
            setTimeout(() => {
                showFloater.set(true);
            }, 100 * index);
        }, 1000);

        tick().then(() => {
            animatePosition(index, thisFloater, isVisible);
        });
    })

    onDestroy(() => {
        if (quoteVideo) {
            quoteVideo.pause();
            quoteVideo.src = '';
            quoteVideo.load();
        }
        showFloater.set(false);
    });

</script>

{#if isVisible}
    <div
        transition:fade={{duration: 1000}}
        class="floater_container"
        data-index={index}
        style="left: {x}px;
        top: {y}px;
        opacity: {$showFloater ? 1 : 0};
        z-index: {Math.floor(z)};
        transform: scale({(index === $syncedCurrentIndex) ? 1 : objectDistance});
        filter: blur({Math.max(2, (100 - z) * 0.2 + 2)}px);
        transition: {(index === $syncedCurrentIndex || index === $syncedCurrentIndex + 1 || index === $syncedCurrentIndex - 1) ? 'all 2s ease-in-out' : 'none'};"
        class:showcase={index === $syncedCurrentIndex}
        bind:this={thisFloater}
        data-type={$dataSet[index].type}
    >
        
        <div class="floater_header">
            <p class="floater_header_text">{media.split("/").pop()}</p>
        </div>

        <div class="floater_media">
            {#if $dataSet[index].type === 'quote'}
                <video
                    bind:this={quoteVideo}
                    src={$dataSet[index].media}
                    data-sveltekit-preload-data="eager"
                    poster={$dataSet[index].media.replace('.mp4', '_poster.webp')}
                    playsinline
                    disableremoteplayback
                    disablepictureinpicture
                    audio-muted
                    preload="metadata"
                >
                    <track kind="captions" label="Captions" src="" srclang="en" default>
                </video>
            {:else if mediaType === 'image'} 
                <img src={media}
                alt="Image_{index}" data-sveltekit-preload-data="eager"/>

            {:else if mediaType === 'video'}

            <video
                bind:this={videoFloater}
                src={media}
                muted
                loop
                data-sveltekit-preload-data="eager"
                poster={"/posters/" + media.split("/").pop().replace('.mp4', '_poster.webp')}
                loading="eager"
                playsinline
                disableremoteplayback
                disablepictureinpicture
                preload="metadata"
            >
                <track kind="captions" label="Captions" src="" srclang="fr" default>
            </video>

            {:else if floaterType === 'textual' && randomConvSrc}
                <div class="textual">
                    <p>
                        {randomConvSrc.text}
                    </p>
                    <audio src={randomConvSrc.audio} volume={1}></audio>
                </div>
            {:else}
                <div class="loading"></div>
            {/if}
        </div>
    </div>
{/if}

<style>

    .floater_container {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 0px;
        width: 300px;
        height: 230px;
        overflow: hidden;
        transform-origin: top left !important;
        transform: "";
        opacity: 0;
        transition: opacity 1s ease-in-out, filter 1s ease-in-out;
        will-change: top, left, transform, filter;
        border: 2px solid var(--dominant-light);
        border-radius: 5px;
    }

    .floater_container.showcase {
        width: 800px;
        height: 650px;
        z-index: 9999 !important;
        filter: blur(0px) !important;
    }

    .floater_header {
        position: relative;
        width: 100%;
        height: 20%;
        height: fit-content;
        padding: 5px;
        background-color: rgba(255, 255, 255, 0.9);
        color: var(--dominant-color);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .floater_header_text {
        font-size: 1rem;
        font-weight: 200;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .floater_media {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        border-top: 1px solid var(--dominant-light);
        z-index: 1;
        background-color: var(--dominant-light);
    }

    :global(.floater_media video) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }

    :global(.floater_media img, picture) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
    }

    .loading {
        width: 0px;
        height: 0px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        color: #666;
        font-size: 1rem;
    }

    .textual {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        color: #666;
        font-size: 2rem;
        padding: 20px;
    }

    .textual > p {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: pre-wrap;
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        word-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
    }
</style>
