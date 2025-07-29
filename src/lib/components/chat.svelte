<script>
    import { onMount } from 'svelte';
    import { Tween } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { isPopUpShowing } from '$lib/stores/stores.js';
    import { fade, fly } from 'svelte/transition';
    import popSound from '$lib/media/popsound.mp3';
    

   let { chatText, index } = $props();

   let randomNumber = Math.floor(Math.random() * 16 + 55);
   let charLimit = 1200;

   let popSoundElement;

   $effect(() => {
        if ($isPopUpShowing === true && popSoundElement) {
            setTimeout(() => {
                popSoundElement.play();
            }, 2000 * index);

            console.log(chatText);
        }
   });

   onMount(() => {
        if (chatText.length > charLimit) {
            chatText = chatText.slice(0, charLimit) + '...';
        }
   });
</script>

{#if chatText}
    {#key $isPopUpShowing}
        <div class="chat_container" style="max-width: {randomNumber}%;" class:showing={$isPopUpShowing}
        in:fly={{duration: 1000, y: 50, easing: cubicInOut, delay: 2000 * index}} out:fade={{duration: 1000}}>
            <p class="chat_text">{chatText}</p>
        </div>
    {/key}
{/if}

<audio bind:this={popSoundElement} src={popSound} playsinline autoplay={false}></audio>

<style>
    .chat_container {
        display: flex;
        max-width: 0%;
        padding: var(--spacing-m);
        justify-content: flex-start;
        align-items: flex-start;
        gap: 10px;
        background-color: #F2F2F2;
        border-radius: 10px;
        white-space: pre-wrap;
        opacity: 0;
    }

    .chat_container.showing {
        opacity: 1;
    }

    .chat_text {
        font-size: 1.2rem;
        font-weight: 400;
        line-height: 1.2;
        text-align: left;
        white-space: pre-wrap;
    }
</style>
