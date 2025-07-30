<script>
    import Chat from '$lib/components/chat.svelte';
    import { isPopUpShowing } from '$lib/stores/stores.js';
    let { conversation } = $props();
    import { fade } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';
    import { onMount } from 'svelte';

    const charLimit = 1200;

    const formattedPrompts = $derived(
        conversation.conversation.slice(0, 5).map((c) => {
            let formatted = c.prompt;
            if (formatted.length > charLimit) {
                formatted = formatted.slice(0, charLimit) + '...';
            }
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
            formatted = formatted.replace(/\\n/g, '<br>');
            return formatted;
        })
    );

</script>
        

<div class="prompt_scroller_column" class:showing={$isPopUpShowing}>
    <header id="conversation_header" class:showing={$isPopUpShowing}>
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
    
    {#each formattedPrompts as formattedPrompt, index}
        <Chat
        chatText={formattedPrompt} 
        index={index}/>
    {/each}
</div>

<style>

    header {
        z-index: 30;
        opacity: 0;
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: fit-content;
        z-index: 2;
    }

    header.showing {
        opacity: 1;
        transition: opacity 1s ease-in-out;
    }


    .prompt_scroller_column {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-m);
        width: 100vw;
        height: 100vh;
        position: absolute;
        z-index: 999;
        padding: var(--spacing-m);
        padding-top: var(--spacing-xl);
        padding-bottom: var(--spacing-xl);
        align-items: flex-end;
        justify-content: flex-start;
        top: 0;
        left: 0;
        background-color: rgba(255, 255, 255, 0);
        backdrop-filter: blur(0px);
        user-select: none;
        pointer-events: none;
    }

    .prompt_scroller_column.showing {
        backdrop-filter: blur(5px);
        background: rgba(255, 255, 255, 0.2);
        transition: backdrop-filter 1s ease-in-out background-color 1s ease-in-out;
    }

</style>