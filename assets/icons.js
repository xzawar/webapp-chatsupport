/*
 * Inline stroke icons.
 *
 * Redrawn in the Streamline Flex manner: a heavier 2px stroke on the 24x24 grid, round caps
 * and joins everywhere, and geometry simplified to the fewest shapes that still name the
 * subject. The previous set was 1.6px and finely detailed, which reads as thin and slightly
 * generic at 20px and below. A thicker stroke with rounder corners holds its shape at small
 * sizes and is what makes an icon column look drawn rather than assembled.
 *
 * Two rules keep the set coherent:
 *   - One stroke weight. No icon is allowed to be heavier to "balance" it; if a glyph looks
 *     heavy it is because it has too many strokes, and the fix is to remove one.
 *   - Corners are round, not square. Rectangles carry a large rx, arms meet in curves.
 */

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const open = `<svg viewBox="0 0 24 24" ${S}>`;

export const ICONS = {
	back: `${open}<path d="M14.5 5 7.5 12l7 7"/></svg>`,
	search: `${open}<circle cx="10.8" cy="10.8" r="6.8"/><path d="m15.8 15.8 4.2 4.2"/></svg>`,
	send: `${open}<path d="M20.5 3.5 3.8 9.3a.6.6 0 0 0-.06 1.1l6.9 3.1 3.1 6.9a.6.6 0 0 0 1.1-.06Z"/><path d="m20.5 3.5-9.86 9.86"/></svg>`,

	// A closed ticket and a reopened one are the same circle with a different mark inside, so
	// the pair reads as one control in two states instead of two unrelated buttons.
	closeTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/></svg>`,
	reopenTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="M15.6 9.4H9.4a2.5 2.5 0 0 0 0 5h5.4"/><path d="m13.4 7.2 2.2 2.2-2.2 2.2"/></svg>`,

	chat: `${open}<path d="M20.5 11.4c0 4.2-3.8 7.6-8.5 7.6-1 0-2-.15-2.9-.43L3.5 20.5l1.7-4.4a7.3 7.3 0 0 1-1.7-4.7c0-4.2 3.8-7.6 8.5-7.6s8.5 3.4 8.5 7.6Z"/></svg>`,
	mail: `${open}<rect x="2.8" y="5" width="18.4" height="14" rx="3.4"/><path d="m4.6 8.4 6.3 4.2a2 2 0 0 0 2.2 0l6.3-4.2"/></svg>`,
	call: `${open}<path d="M8.5 4.2 10.6 8a1.6 1.6 0 0 1-.3 1.9l-1.4 1.3a12.4 12.4 0 0 0 4 4l1.3-1.4a1.6 1.6 0 0 1 1.9-.3l3.8 2.1a1.7 1.7 0 0 1 .8 1.9l-.5 1.9a2.2 2.2 0 0 1-2.4 1.6C11.4 20.2 3.8 12.6 3 5.8A2.2 2.2 0 0 1 4.6 3.4l1.9-.5a1.7 1.7 0 0 1 2 .8Z"/></svg>`,
	social: `${open}<circle cx="6.6" cy="8" r="2.9"/><circle cx="17.2" cy="5.8" r="2.7"/><circle cx="16.6" cy="17.6" r="2.9"/><path d="m9.2 9.6 4.9 6.2M9.3 6.9l5.2-.6"/></svg>`,
	broadcast: `${open}<path d="M12 10.6v2.8"/><path d="M8.4 8a5.4 5.4 0 0 0 0 8M15.6 8a5.4 5.4 0 0 1 0 8"/><path d="M5.4 5a9.4 9.4 0 0 0 0 14M18.6 5a9.4 9.4 0 0 1 0 14"/></svg>`,

	person: `${open}<circle cx="12" cy="8" r="3.9"/><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0"/></svg>`,
	globe: `${open}<circle cx="12" cy="12" r="8.6"/><path d="M3.8 9.6h16.4M3.8 14.4h16.4"/><path d="M12 3.4c2.1 2.4 3.2 5.3 3.2 8.6s-1.1 6.2-3.2 8.6c-2.1-2.4-3.2-5.3-3.2-8.6s1.1-6.2 3.2-8.6Z"/></svg>`,
	card: `${open}<rect x="2.6" y="5.2" width="18.8" height="13.6" rx="3.4"/><path d="M2.6 10h18.8M6.4 14.8h3.6"/></svg>`,
	database: `${open}<ellipse cx="12" cy="6.2" rx="7.2" ry="3"/><path d="M4.8 6.2v11.6c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3V6.2"/><path d="M4.8 12c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3"/></svg>`,

	/*
	 * A six-tooth gear rather than the eight-lobed path this used to be. The old one was a
	 * single 700-character path that turned to mush below 18px; at rail size the teeth have to
	 * be countable or it just looks like a smudged circle.
	 */
	settings: `${open}<circle cx="12" cy="12" r="3.1"/><path d="M12 2.6v2.6M12 18.8v2.6M20.1 7.3l-2.25 1.3M6.15 15.4l-2.25 1.3M20.1 16.7l-2.25-1.3M6.15 8.6 3.9 7.3"/></svg>`,

	help: `${open}<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.35c-.72.3-1 .86-1 1.6v.35"/><path d="M12 16.9h.01"/></svg>`,
	image: `${open}<rect x="2.8" y="4.4" width="18.4" height="15.2" rx="3.4"/><circle cx="8.6" cy="9.6" r="1.9"/><path d="m3.6 16.8 4.4-3.8a2 2 0 0 1 2.6 0l2.2 1.9 2-1.7a2 2 0 0 1 2.6 0l3 2.6"/></svg>`,
	moon: `${open}<path d="M20.2 14.4A8.5 8.5 0 0 1 9.6 3.8a8.7 8.7 0 1 0 10.6 10.6Z"/></svg>`,
	bell: `${open}<path d="M18.2 9.6a6.2 6.2 0 1 0-12.4 0c0 4.9-2 6.5-2 6.5h16.4s-2-1.6-2-6.5Z"/><path d="M13.9 19.8a2.2 2.2 0 0 1-3.8 0"/></svg>`,
	sweep: `${open}<path d="M4 20 11.4 12.6"/><path d="m14.6 4.4 5 5-4.4 4.4-5-5z"/><path d="M16.4 16.8h3.6M13.4 20h6.6"/></svg>`,
	power: `${open}<path d="M12 3.4v8.2"/><path d="M7.2 6.6a7.6 7.6 0 1 0 9.6 0"/></svg>`,
	shield: `${open}<path d="M12 3.2 5.2 5.9v5.3c0 4.3 2.9 8.2 6.8 9.4 3.9-1.2 6.8-5.1 6.8-9.4V5.9Z"/><path d="m9.2 11.9 2 2 3.6-3.7"/></svg>`,

	/*
	 * Sign out. A door with an arrow leaving it, not the arrow alone: an arrow on its own is
	 * read as "export" or "share" at least as often as "log out", and this is a destructive
	 * enough action that it should not be ambiguous.
	 */
	logout: `${open}<path d="M14.6 3.8h2.6a2.6 2.6 0 0 1 2.6 2.6v11.2a2.6 2.6 0 0 1-2.6 2.6h-2.6"/><path d="M10 16.2 14.2 12 10 7.8"/><path d="M14.2 12H3.8"/></svg>`,
};

/*
 * A stable colour per conversation.
 *
 * These are the same twelve discs as AvatarPalette on the phone, in the same order, so a
 * visitor is the same colour on both screens. Flat fills, no gradients: a two-stop gradient on
 * a 28px circle is invisible as a gradient and only serves to make the colour harder to name.
 *
 * PersonAvatar seeds from the conversation id for the same reason this does. Every website
 * visitor shows the same letter, so colour is the only thing telling them apart, and it has to
 * survive a reload.
 */
const PALETTE = [
	'#2F6F92',
	'#0E8F86',
	'#1E7A4B',
	'#7A5AA8',
	'#B2593A',
	'#9A3F63',
	'#3F5BA9',
	'#6B6320',
	'#8A4A2B',
	'#2F6B6B',
	'#5C4B8A',
	'#96562F',
];

export function avatarFor(seed) {
	let hash = 0;
	const text = String(seed || '');
	for (let i = 0; i < text.length; i++) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
	}
	return PALETTE[hash % PALETTE.length];
}
