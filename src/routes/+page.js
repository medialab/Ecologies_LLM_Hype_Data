

import { error } from '@sveltejs/kit';

const chats = [
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

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	return {
		chats: chats
	}
}