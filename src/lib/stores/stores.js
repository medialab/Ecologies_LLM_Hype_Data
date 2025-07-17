import { writable } from "svelte/store";
import { browser } from "$app/environment";

import dataset from "$lib/media/newJson.json" with { type: "json" };

export const dataSet = writable(dataset);
export const entitiesLimit = writable(50);

// Clear any stale showcase state on app start
if (browser) {
    localStorage.removeItem("isShowcasePlaying");
}

function createSyncedStore(key, initialValue) {
    
    let startValue = initialValue;
    
    if (browser) {
        const stored = localStorage.getItem(key);
        //console.log(`[SyncedStore] localStorage.getItem(${key}):`, stored);
        if (stored) {
            startValue = JSON.parse(stored);
            //console.log(`[SyncedStore] Using stored value for ${key}:`, startValue);
        } else {
            //console.log(`[SyncedStore] No stored value for ${key}, using initial:`, initialValue);
        }
    } else {
        //console.log(`[SyncedStore] Not in browser, using initial value for ${key}`);
    }
    
    const {subscribe, set, update} = writable(startValue);

    if (browser) {
        window.addEventListener("storage", (e) => {
            if (e.key === key && e.newValue) {
                //console.log(`[SyncedStore] Storage event for ${key}, newValue:`, e.newValue);
                set(JSON.parse(e.newValue));
            }
        });
    }

    return {
        subscribe,
        set: (value) => {
            //console.log(`[SyncedStore] SET called for ${key}, value:`, value);
            set(value);
            if (browser) {
                localStorage.setItem(key, JSON.stringify(value));
                //console.log(`[SyncedStore] Saved to localStorage: ${key} =`, value);
            }
        },
        update: (updater) => {
            //console.log(`[SyncedStore] UPDATE called for ${key}`);
            update((value) => {
                const newValue = updater(value);
                //console.log(`[SyncedStore] UPDATE: ${key} changed from`, value, 'to', newValue);
                if (browser) {
                    localStorage.setItem(key, JSON.stringify(newValue));
                    //console.log(`[SyncedStore] Saved to localStorage: ${key} =`, newValue);
                }
                return newValue;
            });
        }
    }
}

// Clear the stored index on app start BEFORE creating the store
if (browser) {
    localStorage.removeItem("currentIndex");
}

export const syncedCurrentIndex = createSyncedStore("currentIndex", -1);
export const syncedCurrentPeriod = createSyncedStore("currentPeriod", "september");
export const isQuoteAudioPlaying = createSyncedStore("isQuoteAudioPlaying", false);
export const isQuoteVideoPlaying = createSyncedStore("isQuoteVideoPlaying", false);
//export const isAudioTimelinePlaying = createSyncedStore("isAudioTimelinePlaying", false); 