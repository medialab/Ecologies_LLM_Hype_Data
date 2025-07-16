<script>
    import { syncedCurrentIndex, isPlaying, dataSet, entitiesLimit, isShowcasePlaying, syncedCurrentPeriod, pausedForQuote } from "$lib/stores/stores";
    import { onMount, tick, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { fade } from "svelte/transition";
    import { Tween } from "svelte/motion";
    import { cubicIn } from "svelte/easing";

    export let index;
    export let animatePosition;
    export let setPosition;
    export let randomImages;
    export let randomVideos;
    export let randomConvs;

    let x = 0;
    let y = 0;
    let z = 0;
    let thisFloater;
    let quoteVideo;
    let quoteAudioCtx;
    let quoteSourceNode;
    let quotePannerNode;
    let objectDistance = 0;
    let showFloater = writable(false);
    let floaterType = null;
    let isVisible = true;
    let textualAudio = null;

    let randomImageSrc = writable("");
    let randomVideoSrc = writable("");
    let randomConvSrc = writable("");

    let hasPlayedOnce = false;

    $: isVisible = !(index < $syncedCurrentIndex-$entitiesLimit || index > $syncedCurrentIndex+$entitiesLimit);
    
    $: if (quoteVideo && $dataSet[index].type === 'quote' && isVisible) {
        if (index === $syncedCurrentIndex && !hasPlayedOnce) {
            isShowcasePlaying.set(true);
            quoteVideo.currentTime = 0;
            quoteVideo.volume = 1;
            quoteVideo.play();
            hasPlayedOnce = true;
            quoteVideo.onended = () => {
                isShowcasePlaying.set(false);
                pausedForQuote.set(false);
            };
        } else {
            quoteVideo.volume = 0;
        }
    }


    /*$: if (index === $syncedCurrentIndex) { //Ho corretto le condizioni if, meglio filtrare in questo senso
          if (quoteVideo && $dataSet[index].type === 'quote' && isVisible) {
                if (!quoteAudioCtx) {
                    quoteAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    quoteSourceNode = quoteAudioCtx.createMediaElementSource(quoteVideo);
                    quotePannerNode = quoteAudioCtx.createStereoPanner();
                    quoteSourceNode.connect(quotePannerNode).connect(quoteAudioCtx.destination);
                    quotePannerNode.pan.value = 0;
                }
            isShowcasePlaying.set(true);
                quoteVideo.currentTime = 0;
                quoteVideo.volume = 1;
                quoteVideo.play();
                hasPlayedOnce = true;
                quoteVideo.onended = () => {
                    isShowcasePlaying.set(false);
                };
                
            } else if (textualAudio && $dataSet[index].type === 'textual') {
                textualAudio.play();
            } else {
                if (quoteVideo) {   
                    quoteVideo.volume = 0;
                }
                if (textualAudio) {
                    textualAudio.pause();
                }
            }
        }*/


    /*$: if (quoteVideo && $dataSet[index].type === 'quote' && typeof window !== 'undefined') {
        if (!quoteAudioCtx) {
            quoteAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            quoteSourceNode = quoteAudioCtx.createMediaElementSource(quoteVideo);
            quotePannerNode = quoteAudioCtx.createStereoPanner();
            quoteSourceNode.connect(quotePannerNode).connect(quoteAudioCtx.destination);
            quotePannerNode.pan.value = 0;
        }
    }*/

    $: if (index !== $syncedCurrentIndex) {
        hasPlayedOnce = false;
    }

    function getRandomFloaterType() {
        if (randomImages && randomVideos && randomConvs && $syncedCurrentPeriod) {
            if (Object.keys(randomImages).length > 0) {
                randomImageSrc.set(Object.values(randomImages)[index % Object.keys(randomImages).length].default);
            }
            if (Object.keys(randomVideos).length > 0) {
                randomVideoSrc.set(Object.values(randomVideos)[index % Object.keys(randomVideos).length].default);
            }
            if (Object.keys(randomConvs).length > 0) {
                randomConvSrc.set(Object.values(randomConvs)[index % Object.keys(randomConvs).length].default);
            }
            floaterType = ['video', 'image', 'video', 'image', 'textual'][Math.floor(Math.random() * 5)];
        }
    }

    $: getRandomFloaterType();
    
    onMount( async () => {
        await getRandomFloaterType();
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
        if (quoteAudioCtx) {
            quoteAudioCtx.close();
            quoteAudioCtx = null;
            quoteSourceNode = null;
            quotePannerNode = null;
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
                disablepictureinpicture
                preload="metadata"
            >
                <track kind="captions" label="Captions" src="" srclang="fr" default>
            </video>
            {:else if floaterType === 'textual' && $randomConvSrc !== ""}
                <div class="textual">
                    <p>
                        {$randomConvSrc.text}
                    </p>
                    <audio src={$randomConvSrc.audio} volume={0.5} bindthis={textualAudio}></audio>
                </div>
            {:else}
                <div class="loading">Loading...</div>
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
        width: 100%;
        height: 100%;
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
