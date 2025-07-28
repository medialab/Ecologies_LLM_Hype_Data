<script>
    import Chat from '$lib/components/chat.svelte';
    import { isPopUpShowing } from '$lib/stores/stores.js';
    let { conversation } = $props();
    import { fade } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';

</script>

        <header id="conversation_header" class:showing={$isPopUpShowing}
        in:fade={{duration: 1000, easing: cubicInOut, delay: 1000}} out:fade={{duration: 1000, easing: cubicInOut, delay: 1000}}>
            <p>
                {conversation.date}
            </p>
            <p>
                {conversation.title}
            </p>
            <p>
                {conversation.author}
            </p>
        </header>

        <div class="prompt_scroller_column" class:showing={$isPopUpShowing}>
            {#each conversation.conversation as c, index}
                <Chat 
                container="right"
                chatText={c.prompt} 
                index={index}/>
            {/each}
        </div>
<style>

    header {
        z-index: 12;
        opacity: 0;
    }

    header.showing {
        opacity: 1;
        transition: opacity 1s ease-in-out;
    }

    

    .prompt_scroller_column {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        width: 100%;
        height: 100%;
        position: absolute;
        z-index: 999;
        padding: var(--spacing-m);
        padding-top: var(--spacing-xl);
        padding-bottom: var(--spacing-xl);
        align-items: flex-end;
        justify-content: flex-start;
        top: 0;
        left: 0;
        background-color: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(5px);
        opacity: 0;
        user-select: none;
        pointer-events: none;
    }

    .prompt_scroller_column.showing {
        opacity: 1;
        transition: opacity 1s ease-in-out;
    }


</style>