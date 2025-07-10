<script>
    import { syncedCurrentIndex, isPlaying, dataSet, entitiesLimit, isShowcasePlaying } from "$lib/stores/stores";
    import { randomImages, randomVideos } from "$lib/scripts/content";
    import { onMount, tick, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { fade } from "svelte/transition";

    export let index;
    export let animatePosition;
    export let setPosition;

    let x = 0;
    let y = 0;
    let z = 0;
    let thisFloater;
    let quoteVideo;
    let objectDistance = 0;
    let showFloater = writable(false);
    let floaterType = null;
    let isVisible = true;
    let randomImageSrc = writable("");
    let randomVideoSrc = writable("");
    let hasPlayedOnce = false;

    $: isVisible = !(index < $syncedCurrentIndex-$entitiesLimit || index > $syncedCurrentIndex+$entitiesLimit);
    
    $: if (quoteVideo && $dataSet[index].type === 'quote' && isVisible) {
        if (index === $syncedCurrentIndex && !hasPlayedOnce) {
            isShowcasePlaying.set(true);
            quoteVideo.currentTime = 0;
            quoteVideo.muted  = false;
            quoteVideo.play();
            hasPlayedOnce = true;
            quoteVideo.onended = () => {
                isShowcasePlaying.set(false);
                quoteVideo.muted = true;
            };
        }
    }

    // Reset hasPlayedOnce when the index changes
    $: if (index !== $syncedCurrentIndex) {
        hasPlayedOnce = false;
    }
    
    onMount( async () => {
        setTimeout(async () => {
            await randomImages;
            await randomVideos;
            
            if (Object.keys(randomImages).length > 0) {
                randomImageSrc.set(Object.values(randomImages)[index % Object.keys(randomImages).length].default);
            }
            if (Object.keys(randomVideos).length > 0) {
                randomVideoSrc.set(Object.values(randomVideos)[index % Object.keys(randomVideos).length].default);
            }
            
            floaterType = (Object.keys(randomVideos).length > 0 && Math.random() > 0.5) ? 'video' : 'image';
        }, 50);

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
            <p class="floater_header_text">{floaterType || 'Loading...'}</p>
        </div>

        <div class="floater_media">
            {#if $dataSet[index].type === 'quote' }
                <video
                bind:this={quoteVideo}
                src={$dataSet[index].media}
                muted
                data-sveltekit-preload-data="eager"
                poster={$dataSet[index].media.replace('.mp4', '_poster.webp')}
                playsinline
                disableremoteplayback
                disablepictureinpicture
                ></video>
            {:else if floaterType === 'image' && $randomImageSrc} 
                <enhanced:img src={$randomImageSrc}
                alt="Image_{index}" data-sveltekit-preload-data="eager" loading="eager"></enhanced:img>
            {:else if floaterType === 'video' && $randomVideoSrc}
                <video
                src={$randomVideoSrc}
                autoplay
                muted
                loopisShowcasePlaying value
                data-sveltekit-preload-data="eager"
                loading="eager"
                playsinline
                disableremoteplayback
                disablepictureinpicture></video>
            {:else}
                <div class="loading">Loading...</div>
            {/if}
        </div>
    </div>
{/if}

<style>

    :root {
        --dominant-color: rgb(255, 183, 183);
    }

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
        border: 1px solid var(--dominant-color);
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
        background-color: var(--dominant-color);
        color: rgb(0, 0, 0);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .floater_header_text {
        font-size: 1rem;
        font-weight: 400;
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
        border-top: 1px solid white;
        z-index: 1;
        background-color: rgb(255, 255, 255);
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
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        color: #666;
        font-size: 1rem;
    }
</style>
