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

/*
 * The traced set.
 *
 * chat, social, send and whatsapp are not drawn here: their path data is copied verbatim
 * from the app drawables (ic_nav_chat, ic_nav_social, ic_send, ic_whatsapp), which were
 * themselves traced from the supplied artwork. Redrawing them by hand in the stroke style
 * is what made the two products look related but not identical; copying the geometry is
 * the only way the rail icon and the tab bar icon are actually the same shape.
 *
 * These are filled, not stroked, so they get their own wrapper.
 */
const F = 'fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" stroke="none"';
const solid = `<svg viewBox="0 0 24 24" ${F}>`;

export const ICONS = {
	back: `${open}<path d="M14.5 5 7.5 12l7 7"/></svg>`,
	send: `${solid}<path d="M20.3,2.09L19.9,2L19,2.04L3.79,6.12L3.16,6.38L2.54,6.92L2.31,7.23L2.04,7.91L2,8.85L2.13,9.38L2.36,9.83L2.94,10.46L3.48,10.77L10.05,13.68L10.28,13.9L13.36,20.79L13.54,21.06L13.99,21.51L14.75,21.91L15.15,22L15.83,22L16.36,21.87L16.9,21.6L17.39,21.15L17.62,20.84L17.97,19.9L22,4.77L22,4.1L21.91,3.7L21.69,3.21L21.51,2.94L21.06,2.49ZM19.9,3.43L20.21,3.61L20.48,3.92L20.61,4.28L20.61,4.6L16.63,19.49L16.41,20.12L16.09,20.43L15.65,20.61L15.15,20.57L14.66,20.21L14.44,19.81L11.62,13.5L11.62,13.36L15.38,9.61L15.47,9.47L15.51,9.11L15.33,8.71L14.93,8.49L14.44,8.58L10.64,12.38L10.5,12.38L3.92,9.43L3.57,9.11L3.39,8.67L3.43,8.17L3.57,7.91L3.88,7.59L4.19,7.46L6.03,7.01L17.84,3.79L19.45,3.39Z"/></svg>`,

	// A closed ticket and a reopened one are the same circle with a different mark inside, so
	// the pair reads as one control in two states instead of two unrelated buttons.
	closeTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/></svg>`,
	reopenTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="M15.6 9.4H9.4a2.5 2.5 0 0 0 0 5h5.4"/><path d="m13.4 7.2 2.2 2.2-2.2 2.2"/></svg>`,

	chat: `${solid}<path d="M7.49,12.25L7.49,12.65L7.54,12.7L7.54,12.79L7.67,12.96L7.99,13.14L16.01,13.14L16.33,12.96L16.46,12.79L16.46,12.7L16.51,12.65L16.51,12.25L16.33,11.93L16.01,11.75L7.99,11.75L7.67,11.93L7.54,12.11L7.54,12.2ZM7.49,8.39L7.49,8.84L7.58,9.02L7.9,9.29L8.03,9.29L8.07,9.33L12.11,9.33L12.43,9.2L12.56,9.06L12.7,8.79L12.7,8.43L12.52,8.12L12.34,7.99L12.25,7.99L12.2,7.94L7.94,7.94L7.76,8.03L7.58,8.21ZM2.96,4.17L2.51,4.8L2.15,5.52L2.15,5.61L2.02,5.92L1.97,6.24L1.93,6.28L1.88,6.73L1.84,6.77L1.84,7.09L1.79,7.13L1.79,7.67L1.75,7.72L1.75,15.16L1.79,15.21L1.79,15.43L1.84,15.48L1.88,15.79L1.93,15.84L1.97,16.06L2.06,16.19L2.06,16.28L2.33,16.82L2.65,17.27L3.32,17.94L3.9,18.35L4.26,18.53L4.35,18.53L4.49,18.62L4.58,18.62L4.89,18.75L5.25,18.8L5.29,18.84L5.52,18.84L5.56,18.89L6.68,18.89L6.95,19.11L6.95,19.38L6.82,19.74L6.82,20.32L6.86,20.37L6.86,20.5L6.91,20.55L6.95,20.77L7.22,21.17L7.45,21.4L7.9,21.67L7.99,21.67L8.16,21.76L8.39,21.76L8.43,21.8L8.75,21.8L8.79,21.76L8.97,21.76L9.02,21.71L9.24,21.67L9.64,21.44L9.78,21.31L9.96,21.22L10.09,21.08L10.27,20.99L10.41,20.86L10.59,20.77L10.72,20.64L10.9,20.55L11.04,20.41L11.21,20.32L11.35,20.19L11.53,20.1L11.66,19.96L11.84,19.87L12.38,19.47L12.52,19.42L12.7,19.29L12.79,19.29L13.01,19.15L13.1,19.15L13.41,19.02L13.77,18.98L13.82,18.93L14.09,18.93L14.13,18.89L17,18.89L17.05,18.84L17.54,18.84L17.58,18.8L18.08,18.75L18.12,18.71L18.26,18.71L18.3,18.66L18.8,18.53L19.02,18.39L19.11,18.39L19.47,18.21L20.14,17.76L20.95,17L20.95,16.96L21.26,16.6L21.49,16.19L21.58,16.1L21.94,15.34L21.94,15.25L22.07,14.94L22.07,14.8L22.12,14.76L22.16,14.31L22.21,14.27L22.21,13.86L22.25,13.82L22.25,7.76L22.21,7.72L22.21,7.13L22.16,7.09L22.16,6.77L22.12,6.73L22.12,6.5L22.07,6.46L22.07,6.28L22.03,6.24L21.98,5.92L21.94,5.88L21.85,5.52L21.49,4.8L21.04,4.17L20.28,3.41L19.65,2.96L19.33,2.83L19.24,2.74L19.15,2.74L18.93,2.6L18.84,2.6L18.39,2.42L18.21,2.42L18.17,2.38L17.99,2.38L17.94,2.33L17.72,2.33L17.67,2.29L17.36,2.29L17.32,2.24L16.78,2.24L16.73,2.2L7.27,2.2L7.22,2.24L6.68,2.24L6.64,2.29L6.06,2.33L6.01,2.38L5.83,2.38L5.79,2.42L5.65,2.42L5.61,2.47L5.47,2.47L5.43,2.51L5.07,2.6L4.35,2.96L3.72,3.41ZM3.81,5.38L4.08,5.02L4.58,4.53L5.07,4.17L5.29,4.08L5.38,3.99L5.47,3.99L5.61,3.9L5.7,3.9L6.01,3.77L6.46,3.72L6.5,3.68L6.82,3.68L6.86,3.63L7.49,3.63L7.54,3.59L16.46,3.59L16.51,3.63L17.14,3.63L17.18,3.68L17.5,3.68L17.54,3.72L17.99,3.77L18.03,3.81L18.39,3.9L18.93,4.17L19.42,4.53L19.92,5.02L20.28,5.52L20.55,6.06L20.55,6.15L20.68,6.46L20.72,6.91L20.77,6.95L20.77,7.27L20.81,7.31L20.81,7.94L20.86,7.99L20.86,13.64L20.81,13.68L20.81,14.13L20.77,14.18L20.72,14.53L20.68,14.58L20.64,14.8L20.55,14.94L20.55,15.03L20.32,15.48L20.01,15.93L19.6,16.37L19.56,16.37L19.11,16.78L18.48,17.14L18.39,17.14L18.03,17.32L17.9,17.32L17.67,17.41L17.41,17.41L17.36,17.45L16.73,17.45L16.69,17.5L14,17.5L13.95,17.54L13.64,17.54L13.59,17.58L13.37,17.58L13.32,17.63L13.01,17.67L12.96,17.72L12.47,17.85L12.16,18.03L12.07,18.03L11.89,18.12L11.8,18.21L11.44,18.39L11.3,18.53L11.13,18.62L10.99,18.75L10.81,18.84L10.68,18.98L10.5,19.07L10.36,19.2L10.18,19.29L10.05,19.42L9.87,19.51L8.7,20.37L8.43,20.37L8.21,20.1L8.21,19.96L8.34,19.65L8.34,19.38L8.39,19.33L8.39,19.2L8.34,19.15L8.34,18.84L8.16,18.39L7.99,18.12L7.72,17.85L7.36,17.63L7.27,17.63L7.09,17.54L6.95,17.54L6.91,17.5L5.74,17.5L5.7,17.45L5.29,17.41L4.62,17.14L4.17,16.82L3.77,16.42L3.54,16.1L3.23,15.39L3.19,15.03L3.14,14.98L3.14,7.99L3.19,7.94L3.19,7.31L3.23,7.27L3.23,6.95L3.28,6.91L3.32,6.46L3.36,6.42L3.45,6.06L3.54,5.92L3.54,5.83L3.63,5.74Z"/></svg>`,
	mail: `${open}<rect x="2.8" y="5" width="18.4" height="14" rx="3.4"/><path d="m4.6 8.4 6.3 4.2a2 2 0 0 0 2.2 0l6.3-4.2"/></svg>`,
	social: `${solid}<path d="M1.25,18.49L1.25,19.34L1.34,19.56L1.56,19.79L1.79,19.88L2.24,19.83L2.6,19.47L2.64,18.67L2.73,18.22L3,17.59L3.31,17.14L3.99,16.56L4.53,16.29L5.07,16.15L5.87,16.2L6.46,16.47L6.19,17.18L6.01,17.99L5.96,18.93L5.92,18.98L5.96,19.38L6.19,19.7L6.46,19.83L6.95,19.79L7.17,19.61L7.31,19.38L7.4,18.17L7.53,17.54L7.76,16.91L8.25,15.97L8.75,15.34L9.55,14.63L10.59,14.09L11.53,13.86L12.47,13.86L13.14,14L14.09,14.4L14.9,14.98L15.48,15.61L15.88,16.2L16.33,17.14L16.6,18.17L16.69,19.38L16.78,19.56L17.05,19.79L17.18,19.83L17.68,19.79L17.9,19.61L18.04,19.38L18.08,19.02L18.04,18.98L17.99,17.99L17.81,17.18L17.54,16.47L17.86,16.29L18.35,16.15L18.93,16.15L19.47,16.29L20.15,16.65L20.69,17.14L21.18,17.95L21.36,18.67L21.36,19.34L21.45,19.56L21.67,19.79L21.9,19.88L22.35,19.83L22.66,19.56L22.75,19.34L22.71,18.22L22.44,17.32L22.21,16.87L21.81,16.29L21,15.52L20.1,15.03L19.11,14.76L17.95,14.81L17.59,14.9L16.91,15.21L16.42,14.54L15.7,13.82L15.16,13.41L13.91,12.79L13.32,12.61L12.56,12.47L11.12,12.52L10.36,12.7L9.55,13.01L8.84,13.41L8.3,13.82L7.58,14.54L7.09,15.21L6.77,15.03L6.05,14.81L4.89,14.76L3.9,15.03L3.27,15.34L2.78,15.7L2.19,16.29L1.79,16.87L1.47,17.54ZM18.26,7.85L17.59,8.03L17.14,8.25L16.6,8.7L16.24,9.19L16.02,9.69L15.88,10.36L15.88,10.77L15.97,11.26L16.29,11.98L16.47,12.25L16.91,12.7L17.9,13.19L18.8,13.28L19.29,13.19L19.97,12.92L20.55,12.47L20.78,12.2L21.13,11.57L21.27,11.17L21.31,10.18L21.22,9.78L21,9.24L20.73,8.84L20.33,8.43L19.92,8.16L19.38,7.94L18.98,7.85ZM4.84,7.85L4.17,8.03L3.54,8.39L3.05,8.88L2.6,9.73L2.51,10.14L2.51,10.99L2.82,11.89L3.4,12.61L3.85,12.92L4.35,13.14L5.02,13.28L5.38,13.28L6.05,13.14L6.64,12.88L7,12.61L7.44,12.11L7.71,11.62L7.85,11.21L7.89,10.09L7.76,9.6L7.35,8.88L6.86,8.39L5.96,7.94L5.56,7.85ZM11.48,4.12L10.86,4.26L10.14,4.57L9.73,4.84L9.1,5.47L8.84,5.87L8.48,6.73L8.39,7.17L8.39,8.12L8.61,8.97L8.88,9.51L9.37,10.14L9.73,10.45L10.14,10.72L10.99,11.08L11.48,11.17L12.34,11.17L12.97,11.03L13.68,10.72L14.13,10.41L14.67,9.87L15.03,9.33L15.34,8.52L15.43,8.03L15.43,7.26L15.34,6.77L15.03,5.96L14.67,5.42L14.13,4.89L13.59,4.53L12.79,4.21L12.34,4.12ZM18.4,9.24L18.8,9.24L19.29,9.42L19.74,9.87L19.92,10.36L19.88,10.95L19.7,11.3L19.38,11.62L18.89,11.84L18.31,11.84L17.9,11.66L17.59,11.39L17.32,10.86L17.32,10.23L17.45,9.91L17.86,9.46ZM5.02,9.24L5.56,9.28L6.01,9.51L6.32,9.87L6.5,10.27L6.5,10.81L6.32,11.26L5.92,11.66L5.51,11.84L4.89,11.84L4.48,11.66L4.12,11.3L3.9,10.81L3.9,10.32L4.17,9.73L4.53,9.42ZM11.66,5.51L12.16,5.51L12.56,5.6L12.97,5.78L13.28,6.01L13.55,6.28L13.82,6.68L13.95,7L14.04,7.44L14.04,7.85L13.95,8.3L13.77,8.7L13.55,9.02L12.97,9.51L12.2,9.78L11.39,9.73L10.59,9.33L10.09,8.79L9.91,8.43L9.78,7.94L9.82,7.13L10.23,6.32L10.86,5.78L11.12,5.65Z"/></svg>`,
	broadcast: `${open}<path d="M12 10.6v2.8"/><path d="M8.4 8a5.4 5.4 0 0 0 0 8M15.6 8a5.4 5.4 0 0 1 0 8"/><path d="M5.4 5a9.4 9.4 0 0 0 0 14M18.6 5a9.4 9.4 0 0 1 0 14"/></svg>`,

	person: `${open}<circle cx="12" cy="8" r="3.9"/><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0"/></svg>`,
	globe: `${open}<circle cx="12" cy="12" r="8.6"/><path d="M3.8 9.6h16.4M3.8 14.4h16.4"/><path d="M12 3.4c2.1 2.4 3.2 5.3 3.2 8.6s-1.1 6.2-3.2 8.6c-2.1-2.4-3.2-5.3-3.2-8.6s1.1-6.2 3.2-8.6Z"/></svg>`,
	card: `${open}<rect x="2.6" y="5.2" width="18.8" height="13.6" rx="3.4"/><path d="M2.6 10h18.8M6.4 14.8h3.6"/></svg>`,
	database: `${open}<ellipse cx="12" cy="6.2" rx="7.2" ry="3"/><path d="M4.8 6.2v11.6c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3V6.2"/><path d="M4.8 12c0 1.66 3.22 3 7.2 3s7.2-1.34 7.2-3"/></svg>`,

	/*
	 * Traced from the gear the client supplied: eight rounded teeth around a hollow hub,
	 * drawn at 1.9 rather than 1.6 so it carries the same weight as that artwork. The path
	 * is generated, so every tooth is identical - the previous six-spoke version was hand
	 * written and visibly lopsided at rail size.
	 */
	settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9.37 5.14 L9.72 2.11 L14.28 2.11 L14.63 5.14 L14.99 5.29 L17.38 3.39 L20.61 6.62 L18.71 9.01 L18.86 9.37 L21.89 9.72 L21.89 14.28 L18.86 14.63 L18.71 14.99 L20.61 17.38 L17.38 20.61 L14.99 18.71 L14.63 18.86 L14.28 21.89 L9.72 21.89 L9.37 18.86 L9.01 18.71 L6.62 20.61 L3.39 17.38 L5.29 14.99 L5.14 14.63 L2.11 14.28 L2.11 9.72 L5.14 9.37 L5.29 9.01 L3.39 6.62 L6.62 3.39 L9.01 5.29 Z"/><circle cx="12" cy="12" r="4.05"/></svg>`,

	/*
	 * Lock and unlock: the client's padlock, and the closed version of the same drawing.
	 * Identical body and keyhole in both, so the pair reads as one control in two states -
	 * only the shackle moves.
	 */
	lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.7" y="10.3" width="14.6" height="10.5" rx="2.9"/><path d="M8.3 10.3V7.7a3.7 3.7 0 0 1 7.4 0v2.6"/><circle cx="12" cy="14.7" r="1.45" fill="currentColor" stroke="none"/><path d="M12 15.5v2.3"/></svg>`,
	unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4.7" y="10.3" width="14.6" height="10.5" rx="2.9"/><path d="M8.3 10.3V7.5a3.7 3.7 0 0 1 7.05-1.5"/><circle cx="12" cy="14.7" r="1.45" fill="currentColor" stroke="none"/><path d="M12 15.5v2.3"/></svg>`,

	help: `${open}<circle cx="12" cy="12" r="8.6"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.35c-.72.3-1 .86-1 1.6v.35"/><path d="M12 16.9h.01"/></svg>`,
	image: `${open}<rect x="2.8" y="4.4" width="18.4" height="15.2" rx="3.4"/><circle cx="8.6" cy="9.6" r="1.9"/><path d="m3.6 16.8 4.4-3.8a2 2 0 0 1 2.6 0l2.2 1.9 2-1.7a2 2 0 0 1 2.6 0l3 2.6"/></svg>`,
	moon: `${open}<path d="M20.2 14.4A8.5 8.5 0 0 1 9.6 3.8a8.7 8.7 0 1 0 10.6 10.6Z"/></svg>`,
	bell: `${open}<path d="M18.2 9.6a6.2 6.2 0 1 0-12.4 0c0 4.9-2 6.5-2 6.5h16.4s-2-1.6-2-6.5Z"/><path d="M13.9 19.8a2.2 2.2 0 0 1-3.8 0"/></svg>`,
	power: `${open}<path d="M12 3.4v8.2"/><path d="M7.2 6.6a7.6 7.6 0 1 0 9.6 0"/></svg>`,

	/*
	 * Sign out. A door with an arrow leaving it, not the arrow alone: an arrow on its own is
	 * read as "export" or "share" at least as often as "log out", and this is a destructive
	 * enough action that it should not be ambiguous.
	 */
	logout: `${open}<path d="M14.6 3.8h2.6a2.6 2.6 0 0 1 2.6 2.6v11.2a2.6 2.6 0 0 1-2.6 2.6h-2.6"/><path d="M10 16.2 14.2 12 10 7.8"/><path d="M14.2 12H3.8"/></svg>`,

	/*
	 * A monitor, for "Link a computer" and the pairing screen. Both used to show the globe
	 * from "Link your website", so two unrelated rows carried the same picture.
	 */
	monitor: `${open}<rect x="2" y="4" width="20" height="13" rx="2.2"/><path d="M9.2 17v2.6M14.8 17v2.6"/><path d="M7 20.4h10"/></svg>`,
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
