/*
 * Inline stroke icons, drawn on the same 24x24 grid and the same 1.6 stroke weight as the
 * Android drawables, so the two surfaces do not look like they came from different products.
 */

const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const open = `<svg viewBox="0 0 24 24" ${S}>`;

export const ICONS = {
	menu: `${open}<path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
	back: `${open}<path d="M14.5 5.5 8 12l6.5 6.5"/></svg>`,
	search: `${open}<circle cx="11" cy="11" r="6.4"/><path d="m16 16 4 4"/></svg>`,
	send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 20.4 21 12 3.6 3.6l.02 6.53L15 12l-11.38 1.87z"/></svg>`,
	check: `${open}<path d="m5 12.8 4.2 4.2L19 7.4"/></svg>`,
	checkDouble: `${open}<path d="m2 12.8 4.2 4.2L15.6 7.6"/><path d="m9.4 15.6 1.4 1.4L20.4 7.6"/></svg>`,
	closeTicket: `${open}<circle cx="12" cy="12" r="8.6"/><path d="m9 9 6 6M15 9l-6 6"/></svg>`,

	chat: `${open}<path d="M20.4 11.6c0 4-3.8 7.2-8.4 7.2a9.7 9.7 0 0 1-2.7-.37L4.6 20l1.2-3.5a6.9 6.9 0 0 1-2.2-4.9c0-4 3.8-7.2 8.4-7.2s8.4 3.2 8.4 7.2Z"/></svg>`,
	mail: `${open}<rect x="3" y="5.4" width="18" height="13.2" rx="2.4"/><path d="m3.6 7.2 8.4 5.6 8.4-5.6"/></svg>`,
	broadcast: `${open}<path d="M12 10.4v3.2"/><path d="M8.4 7.6a5.6 5.6 0 0 0 0 8.8M15.6 7.6a5.6 5.6 0 0 1 0 8.8"/><path d="M5.4 4.6a9.6 9.6 0 0 0 0 14.8M18.6 4.6a9.6 9.6 0 0 1 0 14.8"/></svg>`,
	social: `${open}<circle cx="7" cy="8" r="2.6"/><circle cx="17" cy="6.4" r="2.4"/><circle cx="16.4" cy="17.4" r="2.6"/><path d="m9.3 9.2 5 6.4M9.4 7.1l5.3-.5"/></svg>`,
	person: `${open}<path d="M5 20c0-3.4 3.1-5.8 7-5.8s7 2.4 7 5.8"/><circle cx="12" cy="7.8" r="3.8"/></svg>`,
	globe: `${open}<circle cx="12" cy="12" r="8.8"/><path d="M3.4 9.6h17.2M3.4 14.4h17.2"/><path d="M12 3.2c2.2 2.4 3.3 5.3 3.3 8.8s-1.1 6.4-3.3 8.8M12 3.2C9.8 5.6 8.7 8.5 8.7 12s1.1 6.4 3.3 8.8"/></svg>`,
	card: `${open}<rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.6"/><path d="M2.8 10h18.4M6.2 14.6h3.4"/></svg>`,
	database: `${open}<ellipse cx="12" cy="6.2" rx="7.4" ry="2.8"/><path d="M4.6 6.2v11.6c0 1.55 3.31 2.8 7.4 2.8s7.4-1.25 7.4-2.8V6.2"/><path d="M4.6 12c0 1.55 3.31 2.8 7.4 2.8s7.4-1.25 7.4-2.8"/></svg>`,
	settings: `${open}<circle cx="12" cy="12" r="2.9"/><path d="M19.2 14.2a1.6 1.6 0 0 0 .32 1.76l.06.06a1.9 1.9 0 1 1-2.7 2.7l-.06-.06a1.6 1.6 0 0 0-1.76-.32 1.6 1.6 0 0 0-.97 1.47v.17a1.9 1.9 0 1 1-3.8 0v-.09a1.6 1.6 0 0 0-1.04-1.46 1.6 1.6 0 0 0-1.76.32l-.06.06a1.9 1.9 0 1 1-2.7-2.7l.06-.06a1.6 1.6 0 0 0 .32-1.76 1.6 1.6 0 0 0-1.47-.97H3.4a1.9 1.9 0 1 1 0-3.8h.09A1.6 1.6 0 0 0 4.95 8.6a1.6 1.6 0 0 0-.32-1.76l-.06-.06a1.9 1.9 0 1 1 2.7-2.7l.06.06a1.6 1.6 0 0 0 1.76.32h.08a1.6 1.6 0 0 0 .97-1.47V2.8a1.9 1.9 0 1 1 3.8 0v.09a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.76-.32l.06-.06a1.9 1.9 0 1 1 2.7 2.7l-.06.06a1.6 1.6 0 0 0-.32 1.76v.08a1.6 1.6 0 0 0 1.47.97h.17a1.9 1.9 0 1 1 0 3.8h-.09a1.6 1.6 0 0 0-1.4.85Z"/></svg>`,
	help: `${open}<circle cx="12" cy="12" r="8.8"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.32c-.7.28-1 .84-1 1.58v.3"/><path d="M12 16.8h.01"/></svg>`,
	moon: `${open}<path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.6 8.6 0 1 0 10.2 10.2Z"/></svg>`,
	bell: `${open}<path d="M18 9.6a6 6 0 1 0-12 0c0 5-2 6.4-2 6.4h16s-2-1.4-2-6.4Z"/><path d="M13.7 19.6a2 2 0 0 1-3.4 0"/></svg>`,
	sweep: `${open}<path d="M4.2 19.8 12 12"/><path d="m14.6 4.2 5.2 5.2-4.4 4.4-5.2-5.2z"/><path d="M16.4 16.6h3.4M13.6 19.8h6.2"/></svg>`,
	power: `${open}<path d="M12 3.6v8"/><path d="M7.4 6.6a7.4 7.4 0 1 0 9.2 0"/></svg>`,
	call: `${open}<path d="M20.4 16.6v2.6a1.7 1.7 0 0 1-1.86 1.7 17 17 0 0 1-7.4-2.63 16.7 16.7 0 0 1-5.14-5.14A17 17 0 0 1 3.37 5.7 1.7 1.7 0 0 1 5.06 3.8h2.6a1.7 1.7 0 0 1 1.7 1.46c.1.82.3 1.62.58 2.38a1.7 1.7 0 0 1-.38 1.8l-1.1 1.1a13.6 13.6 0 0 0 5.14 5.14l1.1-1.1a1.7 1.7 0 0 1 1.8-.38c.76.29 1.56.48 2.38.58a1.7 1.7 0 0 1 1.46 1.72Z"/></svg>`,
	shield: `${open}<path d="M12 3.2 5 6v5.4c0 4.3 2.9 8.3 7 9.4 4.1-1.1 7-5.1 7-9.4V6Z"/><path d="m9.2 11.9 2 2 3.6-3.6"/></svg>`,
};

/*
 * A stable colour per conversation. The app seeds its illustrated avatars off the conversation
 * id for the same reason: the same visitor keeps the same colour on both screens.
 */
const PALETTE = [
	'linear-gradient(145deg,#51C9FD,#2F6F92)',
	'linear-gradient(145deg,#7C3AAF,#3F3FBF)',
	'linear-gradient(145deg,#1E9E52,#0E8F86)',
	'linear-gradient(145deg,#D97706,#C2372F)',
	'linear-gradient(145deg,#B83280,#7C3AAF)',
	'linear-gradient(145deg,#0E8F86,#1D6FE0)',
	'linear-gradient(145deg,#8A6A3B,#5B3A72)',
	'linear-gradient(145deg,#3F3FBF,#1D6FE0)',
];

export function avatarFor(seed) {
	let hash = 0;
	const text = String(seed || '');
	for (let i = 0; i < text.length; i++) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
	}
	return PALETTE[hash % PALETTE.length];
}
