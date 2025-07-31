import { writable } from 'svelte/store';
import { browser } from '$app/environment';

import dataset from '$lib/media/newJson.json' assert { type: 'json' };

export const dataSet = writable(dataset);

// Clear the stored values BEFORE creating any stores to prevent race conditions
if (browser) {
	// Clear all synced store values
	const keysToRemove = [
		'isShowcasePlaying',
		'currentIndex',
		'currentPeriod',
		'isQuoteAudioPlaying',
		'isQuoteVideoPlaying',
		'isAudioTimelinePlaying',
		'isPopUpShowing',
		'isRandomIndex',
		'videoQuoteHasEnded'
	];
	
	keysToRemove.forEach(key => localStorage.removeItem(key));
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

	const { subscribe, set, update } = writable(startValue);

	// Store cleanup function for event listener
	let storageHandler = null;

	if (browser) {
		storageHandler = (e) => {
			if (e.key === key && e.newValue) {
				//console.log(`[SyncedStore] Storage event for ${key}, newValue:`, e.newValue);
				set(JSON.parse(e.newValue));
			}
		};
		window.addEventListener('storage', storageHandler);
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
		},
		// Add cleanup method
		cleanup: () => {
			if (browser && storageHandler) {
				window.removeEventListener('storage', storageHandler);
			}
		}
	};
}

export const syncedCurrentIndex = createSyncedStore('currentIndex', -1);
export const syncedCurrentPeriod = createSyncedStore('currentPeriod', 'intro');
export const isQuoteAudioPlaying = createSyncedStore('isQuoteAudioPlaying', false);
export const isQuoteVideoPlaying = createSyncedStore('isQuoteVideoPlaying', false);
export const isAudioTimelinePlaying = createSyncedStore("isAudioTimelinePlaying", false);
export const isPopUpShowing = createSyncedStore("isPopUpShowing", false);
export const randomIndex = createSyncedStore("isRandomIndex", 0);

export const videoQuoteHasEnded = createSyncedStore("videoQuoteHasEnded", false);

export const floaterLimiter = writable(400);