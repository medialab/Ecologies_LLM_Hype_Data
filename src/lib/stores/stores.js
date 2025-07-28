import { writable } from 'svelte/store';
import { browser } from '$app/environment';

import dataset from '$lib/media/newJson.json' assert { type: 'json' };

export const dataSet = writable(dataset);

// Clear any stale showcase state on app start
if (browser) {
	localStorage.removeItem('isShowcasePlaying');
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

	if (browser) {
		window.addEventListener('storage', (e) => {
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
	};
}

// Clear the stored index on app start BEFORE creating the store
if (browser) {
	localStorage.removeItem('currentIndex');
	localStorage.removeItem('currentPeriod');
	localStorage.removeItem('isQuoteAudioPlaying');
	localStorage.removeItem('isQuoteVideoPlaying');
	localStorage.removeItem('isAudioTimelinePlaying');
	localStorage.removeItem('isPopUpShowing');
	localStorage.removeItem('isRandomIndex');
}

export const chats = [
    {
        "title": "Chat 1",
        "date": "2021-01-01",
        "author": "John Doe",
        "conversation": [
            {
            "prompt": "Donne moi une liste de 10 cabinets d'avocats de taille \"boutiques\" à Paris en pénal des affaires et compliance"
            },
            {
            "prompt": "Donne moi une liste des 20 meilleurs cabinets français en droit pénal des affaires et conformité/compliance"
            },
            {
            "prompt": "Quels sont les cabinets recommandés par \"Le Monde du Droit\" en droit pénal des affaires et compliance ?"
            },
            {
            "prompt": "Adapte ce mail de candidature spontanée en une lettre de motivation pour une candidature spontanée pour le même stage, mais au sein du cabinet d'avocats FTMS"
            },
            {
            "prompt": "Adapte ce mail de candidature spontanée en une lettre de motivation pour une candidature spontanée pour le même stage, mais au sein du cabinet d'avocats FTMS : Permettez‑moi de vous écrire afin de vous adresser ma candidature spontanée pour un stage en droit pénal des affaires et conformité au sein de votre cabinet, pour la période de septembre à décembre 2025.\n\nActuellement étudiante en Master 2 au sein de l'Ecole de Droit de Sciences Po Paris, suivant la spécialité contentieux économique et arbitrage avec une concentration en droit pénal et conformité (issue d'une réforme récente), je souhaiterais m'orienter vers une carrière dans ce domaine et passerai le CRFPA en 2025 en droit pénal.\n\nAprès une expérience récente en stage au sein du cabinet August Debouzy, en droit européen, règlementaire et droit de l'environnement, je souhaiterais désormais enrichir ma formation d'une expérience au sein d'un cabinet spécialisé en droit pénal des affaires et conformité, à taille humaine, me permettant de développer des compétences techniques et d'enrichir ma connaissance de la pratique aux côtés d'avocats experts dans ce domaine. Je suis ainsi particulièrement intéressée par votre cabinet, Huc‑Morel Labrousse Avocats, qui se distingue non seulement de par son expertise dans un très large panel d'enjeux du droit pénal des affaires, mais aussi de par sa taille \"boutique\", permettant, il me semble, une grande agilité et efficacité de son action.\n\nAyant développé un fort intérêt pour le droit pénal environnemental ainsi que les enjeux de lutte contre la corruption et des white‑collar crimes, dans un contexte de régulation accrue tant au niveau français qu'européen, réaliser un stage au sein de votre cabinet serait pour moi une opportunité unique de me confronter à la diversité de ces enjeux, tant sur un volet pénal qu'en matière de conformité.\nJe serais ravie de contribuer à vos projets et mettre à votre service les compétences que j'ai pu acquérir au cours de ma formation (droit pénal, procédure pénale et civile, droit des contrats, droit public et européen, droit de l'environnement notamment).\n\nAuriez‑vous de telles opportunités de stage au sein de votre cabinet ?\n\nA toutes fins utiles, vous trouverez ci‑joint mon CV. Si ma candidature vous intéresse, je serais ravie de pouvoir échanger avec vous lors d’un entretien afin de vous exposer plus en détail mes motivations et mon parcours.\n\nEn vous remerciant par avance pour l'attention que vous pourrez porter à mon message, je me tiens à votre disposition pour toute précision.\n\nJe vous prie d'agréer, Madame, l’expression de mes salutations distinguées."
            }
        ]
    },
    {
        "title": "Chat 2",
        "date": "2021-01-02",
        "author": "Jane Doe",
        "conversation": [
            {
                "prompt": "Hello, how are you?",

            },
            {
                "prompt": "I'm fine, thank you!",
            }
        ]
    }
]

export const syncedCurrentIndex = createSyncedStore('currentIndex', -1);
export const syncedCurrentPeriod = createSyncedStore('currentPeriod', 'intro');
export const isQuoteAudioPlaying = createSyncedStore('isQuoteAudioPlaying', false);
export const isQuoteVideoPlaying = createSyncedStore('isQuoteVideoPlaying', false);
export const isAudioTimelinePlaying = createSyncedStore("isAudioTimelinePlaying", false);
export const isPopUpShowing = createSyncedStore("isPopUpShowing", false);
export const randomIndex = createSyncedStore("isRandomIndex", 0);