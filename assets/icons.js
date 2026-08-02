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
	search: `${open}<circle cx="10.8" cy="10.8" r="6.8"/><path d="m15.8 15.8 4.2 4.2"/></svg>`,
	send: `${solid}<path d="M20.3,2.09L19.9,2L19,2.04L3.79,6.12L3.16,6.38L2.54,6.92L2.31,7.23L2.04,7.91L2,8.85L2.13,9.38L2.36,9.83L2.94,10.46L3.48,10.77L10.05,13.68L10.28,13.9L13.36,20.79L13.54,21.06L13.99,21.51L14.75,21.91L15.15,22L15.83,22L16.36,21.87L16.9,21.6L17.39,21.15L17.62,20.84L17.97,19.9L22,4.77L22,4.1L21.91,3.7L21.69,3.21L21.51,2.94L21.06,2.49ZM19.9,3.43L20.21,3.61L20.48,3.92L20.61,4.28L20.61,4.6L16.63,19.49L16.41,20.12L16.09,20.43L15.65,20.61L15.15,20.57L14.66,20.21L14.44,19.81L11.62,13.5L11.62,13.36L15.38,9.61L15.47,9.47L15.51,9.11L15.33,8.71L14.93,8.49L14.44,8.58L10.64,12.38L10.5,12.38L3.92,9.43L3.57,9.11L3.39,8.67L3.43,8.17L3.57,7.91L3.88,7.59L4.19,7.46L6.03,7.01L17.84,3.79L19.45,3.39Z"/></svg>`,

	// A closed ticket and a reopened one are the same circle with a different mark inside, so
	// the pair reads as one control in two states instead of two unrelated buttons.
	closeTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6"/></svg>`,
	reopenTicket: `${open}<circle cx="12" cy="12" r="8.5"/><path d="M15.6 9.4H9.4a2.5 2.5 0 0 0 0 5h5.4"/><path d="m13.4 7.2 2.2 2.2-2.2 2.2"/></svg>`,

	chat: `${solid}<path d="M7.49,12.25L7.49,12.65L7.54,12.7L7.54,12.79L7.67,12.96L7.99,13.14L16.01,13.14L16.33,12.96L16.46,12.79L16.46,12.7L16.51,12.65L16.51,12.25L16.33,11.93L16.01,11.75L7.99,11.75L7.67,11.93L7.54,12.11L7.54,12.2ZM7.49,8.39L7.49,8.84L7.58,9.02L7.9,9.29L8.03,9.29L8.07,9.33L12.11,9.33L12.43,9.2L12.56,9.06L12.7,8.79L12.7,8.43L12.52,8.12L12.34,7.99L12.25,7.99L12.2,7.94L7.94,7.94L7.76,8.03L7.58,8.21ZM2.96,4.17L2.51,4.8L2.15,5.52L2.15,5.61L2.02,5.92L1.97,6.24L1.93,6.28L1.88,6.73L1.84,6.77L1.84,7.09L1.79,7.13L1.79,7.67L1.75,7.72L1.75,15.16L1.79,15.21L1.79,15.43L1.84,15.48L1.88,15.79L1.93,15.84L1.97,16.06L2.06,16.19L2.06,16.28L2.33,16.82L2.65,17.27L3.32,17.94L3.9,18.35L4.26,18.53L4.35,18.53L4.49,18.62L4.58,18.62L4.89,18.75L5.25,18.8L5.29,18.84L5.52,18.84L5.56,18.89L6.68,18.89L6.95,19.11L6.95,19.38L6.82,19.74L6.82,20.32L6.86,20.37L6.86,20.5L6.91,20.55L6.95,20.77L7.22,21.17L7.45,21.4L7.9,21.67L7.99,21.67L8.16,21.76L8.39,21.76L8.43,21.8L8.75,21.8L8.79,21.76L8.97,21.76L9.02,21.71L9.24,21.67L9.64,21.44L9.78,21.31L9.96,21.22L10.09,21.08L10.27,20.99L10.41,20.86L10.59,20.77L10.72,20.64L10.9,20.55L11.04,20.41L11.21,20.32L11.35,20.19L11.53,20.1L11.66,19.96L11.84,19.87L12.38,19.47L12.52,19.42L12.7,19.29L12.79,19.29L13.01,19.15L13.1,19.15L13.41,19.02L13.77,18.98L13.82,18.93L14.09,18.93L14.13,18.89L17,18.89L17.05,18.84L17.54,18.84L17.58,18.8L18.08,18.75L18.12,18.71L18.26,18.71L18.3,18.66L18.8,18.53L19.02,18.39L19.11,18.39L19.47,18.21L20.14,17.76L20.95,17L20.95,16.96L21.26,16.6L21.49,16.19L21.58,16.1L21.94,15.34L21.94,15.25L22.07,14.94L22.07,14.8L22.12,14.76L22.16,14.31L22.21,14.27L22.21,13.86L22.25,13.82L22.25,7.76L22.21,7.72L22.21,7.13L22.16,7.09L22.16,6.77L22.12,6.73L22.12,6.5L22.07,6.46L22.07,6.28L22.03,6.24L21.98,5.92L21.94,5.88L21.85,5.52L21.49,4.8L21.04,4.17L20.28,3.41L19.65,2.96L19.33,2.83L19.24,2.74L19.15,2.74L18.93,2.6L18.84,2.6L18.39,2.42L18.21,2.42L18.17,2.38L17.99,2.38L17.94,2.33L17.72,2.33L17.67,2.29L17.36,2.29L17.32,2.24L16.78,2.24L16.73,2.2L7.27,2.2L7.22,2.24L6.68,2.24L6.64,2.29L6.06,2.33L6.01,2.38L5.83,2.38L5.79,2.42L5.65,2.42L5.61,2.47L5.47,2.47L5.43,2.51L5.07,2.6L4.35,2.96L3.72,3.41ZM3.81,5.38L4.08,5.02L4.58,4.53L5.07,4.17L5.29,4.08L5.38,3.99L5.47,3.99L5.61,3.9L5.7,3.9L6.01,3.77L6.46,3.72L6.5,3.68L6.82,3.68L6.86,3.63L7.49,3.63L7.54,3.59L16.46,3.59L16.51,3.63L17.14,3.63L17.18,3.68L17.5,3.68L17.54,3.72L17.99,3.77L18.03,3.81L18.39,3.9L18.93,4.17L19.42,4.53L19.92,5.02L20.28,5.52L20.55,6.06L20.55,6.15L20.68,6.46L20.72,6.91L20.77,6.95L20.77,7.27L20.81,7.31L20.81,7.94L20.86,7.99L20.86,13.64L20.81,13.68L20.81,14.13L20.77,14.18L20.72,14.53L20.68,14.58L20.64,14.8L20.55,14.94L20.55,15.03L20.32,15.48L20.01,15.93L19.6,16.37L19.56,16.37L19.11,16.78L18.48,17.14L18.39,17.14L18.03,17.32L17.9,17.32L17.67,17.41L17.41,17.41L17.36,17.45L16.73,17.45L16.69,17.5L14,17.5L13.95,17.54L13.64,17.54L13.59,17.58L13.37,17.58L13.32,17.63L13.01,17.67L12.96,17.72L12.47,17.85L12.16,18.03L12.07,18.03L11.89,18.12L11.8,18.21L11.44,18.39L11.3,18.53L11.13,18.62L10.99,18.75L10.81,18.84L10.68,18.98L10.5,19.07L10.36,19.2L10.18,19.29L10.05,19.42L9.87,19.51L8.7,20.37L8.43,20.37L8.21,20.1L8.21,19.96L8.34,19.65L8.34,19.38L8.39,19.33L8.39,19.2L8.34,19.15L8.34,18.84L8.16,18.39L7.99,18.12L7.72,17.85L7.36,17.63L7.27,17.63L7.09,17.54L6.95,17.54L6.91,17.5L5.74,17.5L5.7,17.45L5.29,17.41L4.62,17.14L4.17,16.82L3.77,16.42L3.54,16.1L3.23,15.39L3.19,15.03L3.14,14.98L3.14,7.99L3.19,7.94L3.19,7.31L3.23,7.27L3.23,6.95L3.28,6.91L3.32,6.46L3.36,6.42L3.45,6.06L3.54,5.92L3.54,5.83L3.63,5.74Z"/></svg>`,
	mail: `${open}<rect x="2.8" y="5" width="18.4" height="14" rx="3.4"/><path d="m4.6 8.4 6.3 4.2a2 2 0 0 0 2.2 0l6.3-4.2"/></svg>`,
	call: `${open}<path d="M8.5 4.2 10.6 8a1.6 1.6 0 0 1-.3 1.9l-1.4 1.3a12.4 12.4 0 0 0 4 4l1.3-1.4a1.6 1.6 0 0 1 1.9-.3l3.8 2.1a1.7 1.7 0 0 1 .8 1.9l-.5 1.9a2.2 2.2 0 0 1-2.4 1.6C11.4 20.2 3.8 12.6 3 5.8A2.2 2.2 0 0 1 4.6 3.4l1.9-.5a1.7 1.7 0 0 1 2 .8Z"/></svg>`,
	social: `${solid}<path d="M1.25,18.49L1.25,19.34L1.34,19.56L1.56,19.79L1.79,19.88L2.24,19.83L2.6,19.47L2.64,18.67L2.73,18.22L3,17.59L3.31,17.14L3.99,16.56L4.53,16.29L5.07,16.15L5.87,16.2L6.46,16.47L6.19,17.18L6.01,17.99L5.96,18.93L5.92,18.98L5.96,19.38L6.19,19.7L6.46,19.83L6.95,19.79L7.17,19.61L7.31,19.38L7.4,18.17L7.53,17.54L7.76,16.91L8.25,15.97L8.75,15.34L9.55,14.63L10.59,14.09L11.53,13.86L12.47,13.86L13.14,14L14.09,14.4L14.9,14.98L15.48,15.61L15.88,16.2L16.33,17.14L16.6,18.17L16.69,19.38L16.78,19.56L17.05,19.79L17.18,19.83L17.68,19.79L17.9,19.61L18.04,19.38L18.08,19.02L18.04,18.98L17.99,17.99L17.81,17.18L17.54,16.47L17.86,16.29L18.35,16.15L18.93,16.15L19.47,16.29L20.15,16.65L20.69,17.14L21.18,17.95L21.36,18.67L21.36,19.34L21.45,19.56L21.67,19.79L21.9,19.88L22.35,19.83L22.66,19.56L22.75,19.34L22.71,18.22L22.44,17.32L22.21,16.87L21.81,16.29L21,15.52L20.1,15.03L19.11,14.76L17.95,14.81L17.59,14.9L16.91,15.21L16.42,14.54L15.7,13.82L15.16,13.41L13.91,12.79L13.32,12.61L12.56,12.47L11.12,12.52L10.36,12.7L9.55,13.01L8.84,13.41L8.3,13.82L7.58,14.54L7.09,15.21L6.77,15.03L6.05,14.81L4.89,14.76L3.9,15.03L3.27,15.34L2.78,15.7L2.19,16.29L1.79,16.87L1.47,17.54ZM18.26,7.85L17.59,8.03L17.14,8.25L16.6,8.7L16.24,9.19L16.02,9.69L15.88,10.36L15.88,10.77L15.97,11.26L16.29,11.98L16.47,12.25L16.91,12.7L17.9,13.19L18.8,13.28L19.29,13.19L19.97,12.92L20.55,12.47L20.78,12.2L21.13,11.57L21.27,11.17L21.31,10.18L21.22,9.78L21,9.24L20.73,8.84L20.33,8.43L19.92,8.16L19.38,7.94L18.98,7.85ZM4.84,7.85L4.17,8.03L3.54,8.39L3.05,8.88L2.6,9.73L2.51,10.14L2.51,10.99L2.82,11.89L3.4,12.61L3.85,12.92L4.35,13.14L5.02,13.28L5.38,13.28L6.05,13.14L6.64,12.88L7,12.61L7.44,12.11L7.71,11.62L7.85,11.21L7.89,10.09L7.76,9.6L7.35,8.88L6.86,8.39L5.96,7.94L5.56,7.85ZM11.48,4.12L10.86,4.26L10.14,4.57L9.73,4.84L9.1,5.47L8.84,5.87L8.48,6.73L8.39,7.17L8.39,8.12L8.61,8.97L8.88,9.51L9.37,10.14L9.73,10.45L10.14,10.72L10.99,11.08L11.48,11.17L12.34,11.17L12.97,11.03L13.68,10.72L14.13,10.41L14.67,9.87L15.03,9.33L15.34,8.52L15.43,8.03L15.43,7.26L15.34,6.77L15.03,5.96L14.67,5.42L14.13,4.89L13.59,4.53L12.79,4.21L12.34,4.12ZM18.4,9.24L18.8,9.24L19.29,9.42L19.74,9.87L19.92,10.36L19.88,10.95L19.7,11.3L19.38,11.62L18.89,11.84L18.31,11.84L17.9,11.66L17.59,11.39L17.32,10.86L17.32,10.23L17.45,9.91L17.86,9.46ZM5.02,9.24L5.56,9.28L6.01,9.51L6.32,9.87L6.5,10.27L6.5,10.81L6.32,11.26L5.92,11.66L5.51,11.84L4.89,11.84L4.48,11.66L4.12,11.3L3.9,10.81L3.9,10.32L4.17,9.73L4.53,9.42ZM11.66,5.51L12.16,5.51L12.56,5.6L12.97,5.78L13.28,6.01L13.55,6.28L13.82,6.68L13.95,7L14.04,7.44L14.04,7.85L13.95,8.3L13.77,8.7L13.55,9.02L12.97,9.51L12.2,9.78L11.39,9.73L10.59,9.33L10.09,8.79L9.91,8.43L9.78,7.94L9.82,7.13L10.23,6.32L10.86,5.78L11.12,5.65Z"/></svg>`,
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
	whatsapp: `${solid}<path d="M7.48,7.59L7.18,7.99L6.96,8.43L6.78,9.04L6.74,9.74L6.96,10.75L7.53,11.89L8.32,12.99L9.06,13.86L10.07,14.83L11.12,15.62L12.18,16.19L13.05,16.54L14.28,16.89L15.24,16.89L15.77,16.76L16.56,16.32L17,15.88L17.17,15.53L17.26,15.18L17.3,14.43L17.13,14.26L15.33,13.38L14.89,13.21L14.54,13.25L13.71,14.3L13.49,14.52L13.23,14.56L12.18,14.08L10.99,13.25L10.16,12.37L9.41,11.28L9.46,10.97L10.16,10.09L10.29,9.83L10.29,9.65L9.37,7.42L9.15,7.16L9.02,7.11L8.14,7.11L7.79,7.29ZM18.88,4.04L18.05,3.39L17.3,2.9L16.38,2.42L14.98,1.89L13.58,1.59L12.7,1.5L11.3,1.5L10.25,1.63L9.28,1.85L8.45,2.11L7.62,2.46L6.78,2.9L6.04,3.39L5.25,4L4.55,4.66L3.89,5.4L2.97,6.76L2.27,8.25L1.78,9.96L1.61,11.54L1.61,12.28L1.74,13.6L1.96,14.61L2.27,15.57L3.01,17.2L1.78,21.54L1.57,22.5L7,21.05L8.58,21.75L10.03,22.15L11.39,22.32L12.66,22.32L13.8,22.19L14.94,21.93L15.73,21.67L17.13,21.01L18.66,19.96L19.8,18.86L20.51,17.98L20.94,17.33L21.6,16.06L21.86,15.4L22.22,14.17L22.39,13.16L22.43,11.15L22.17,9.44L21.82,8.3L21.51,7.55L21.03,6.63L20.55,5.88L19.89,5.05ZM17.7,5.31L18.62,6.23L19.01,6.72L19.54,7.51L19.94,8.25L20.42,9.57L20.59,10.31L20.72,11.41L20.72,12.42L20.64,13.25L20.46,14.08L20.2,14.92L19.37,16.58L18.53,17.68L17.48,18.69L16.25,19.52L14.76,20.18L13.27,20.53L11.87,20.61L10.29,20.44L8.93,20.04L8.14,19.69L7.35,19.21L4.06,20.04L4.02,19.91L4.9,16.84L4.46,16.19L4.06,15.4L3.58,13.99L3.36,12.68L3.41,10.79L3.58,9.83L4.02,8.51L4.81,7.07L5.77,5.88L6.87,4.92L7.66,4.39L8.32,4.04L9.9,3.47L10.77,3.3L11.65,3.25L11.69,3.21L13.32,3.3L14.19,3.47L15.16,3.78L16.43,4.39Z"/></svg>`,

	/*
	 * A monitor, for "Link a computer" and the pairing screen. Both used to show the globe
	 * from "Link your website", so two unrelated rows carried the same picture.
	 */
	monitor: `${open}<rect x="2" y="4" width="20" height="13" rx="2.2"/><path d="M9.2 17v2.6M14.8 17v2.6"/><path d="M7 20.4h10"/></svg>`,

	/*
	 * ---------------------------------------------------------------------------------------
	 * THE PORTED SET
	 * ---------------------------------------------------------------------------------------
	 *
	 * Everything below this line is pathData copied character for character out of the Android
	 * drawables in app/src/main/res/drawable. The source file is named in a comment above each
	 * group. Nothing here was drawn, adjusted, rounded, or "cleaned up".
	 *
	 * That is the whole point, and it is worth being blunt about why, because the temptation to
	 * tidy these up will come back. The icons at the top of this file were hand-drawn in the
	 * same STYLE as the app's - same 24x24 grid, same 2px round-capped stroke, same intent -
	 * and the result was a console that looked like a close relative of the app rather than the
	 * same product. Every glyph was off by a fraction: an arrowhead a degree steeper, a corner
	 * radius a half-unit tighter, a circle 0.2 units larger. Individually invisible. Twenty at
	 * once, side by side with a phone, unmistakable.
	 *
	 * Copying the geometry is the only approach that actually converges. A style guide does not
	 * survive two people and six months; a copied path does.
	 *
	 * RULES FOR THIS BLOCK
	 *
	 *   1. To add an icon, copy android:pathData verbatim. Do not retype it.
	 *   2. Android writes arcs and cubics in the same syntax SVG uses, so the string transfers
	 *      unchanged. The only difference that matters is fill rule, handled below.
	 *   3. If a glyph looks wrong here, it is wrong in the app too. Fix the drawable, then
	 *      re-copy. Never patch it on this side only - that re-opens the exact drift this
	 *      block exists to close.
	 *
	 * A NOTE ON FILL RULE, because getting this wrong fails silently and looks deliberate:
	 *
	 * Every solid drawable in the app that has a hole in it carries android:fillType="evenOdd"
	 * - broadcast, globe and power are concentric rings drawn as stacked circles. Android's
	 * default is nonZero, and SVG's default is nonzero as well, so a ring pasted in without the
	 * evenodd rule renders as a filled blob. The `solid` wrapper above sets fill-rule="evenodd"
	 * for exactly this reason. The couple of solid glyphs that have no holes (person) render
	 * identically under either rule, so one wrapper covers the whole set.
	 */

	// ic_check, ic_plus, ic_chevron_right - the three that appear on nearly every screen.
	check: `${open}<path d="M5 12.8 9.6 17.4 19 8"/></svg>`,
	plus: `${open}<path d="M12 5v14M5 12h14"/></svg>`,
	chevronRight: `${open}<path d="M9.5 5 16.5 12l-7 7"/></svg>`,

	// ic_menu, ic_pin, ic_delete, ic_download - inbox row and overflow actions.
	menu: `${open}<path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
	pin: `${open}<path d="M14.8 3.6 20.4 9.2M13.4 5 9.6 8.8a4.6 4.6 0 0 0-2.6 1.3l6 6a4.6 4.6 0 0 0 1.3-2.6l3.8-3.8M8.6 15.4 4 20"/></svg>`,
	delete: `${open}<path d="M4.5 6.6h15M9.4 6.6V5.2a1.8 1.8 0 0 1 1.8-1.8h1.6a1.8 1.8 0 0 1 1.8 1.8v1.4M6.4 6.6l0.9 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l0.9-12"/></svg>`,
	download: `${open}<path d="M12 3.6v11.2M7.8 10.8 12 15l4.2-4.2M4.4 19.6h15.2"/></svg>`,

	// ic_archive_up / ic_archive_down - archive and unarchive. Deliberately the same box with
	// the arrow reversed, so the pair reads as one control in two states.
	archiveUp: `${open}<path d="M4.4 4.6h15.2a1 1 0 0 1 1 1v2.2a1 1 0 0 1-1 1H4.4a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1zM5.6 8.8v9.6a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V8.8M9.5 13.7 12 11.2l2.5 2.5M12 11.2v4.4"/></svg>`,
	archiveDown: `${open}<path d="M4.4 4.6h15.2a1 1 0 0 1 1 1v2.2a1 1 0 0 1-1 1H4.4a1 1 0 0 1-1-1V5.6a1 1 0 0 1 1-1zM5.6 8.8v9.6a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V8.8M9.5 13.1 12 15.6l2.5-2.5M12 15.6v-4.4"/></svg>`,

	// ic_mail_open - a read email, as against the closed `mail` envelope for an unread one.
	mailOpen: `${open}<path d="M3.4 10.2 12 4.2l8.6 6v8.2a2.4 2.4 0 0 1-2.4 2.4H5.8a2.4 2.4 0 0 1-2.4-2.4zM3.4 10.2l8.6 6 8.6-6"/></svg>`,

	// ic_calendar, ic_chart, ic_grid - the analytics and plan surfaces.
	calendar: `${open}<path d="M6.8 5.2h10.4a3.4 3.4 0 0 1 3.4 3.4v8.6a3.4 3.4 0 0 1 -3.4 3.4h-10.4a3.4 3.4 0 0 1 -3.4 -3.4v-8.6a3.4 3.4 0 0 1 3.4 -3.4zM8 3.4v3.6M16 3.4v3.6M3.4 10.4h17.2"/></svg>`,
	chart: `${open}<path d="M4 20h16M7.4 20v-6.2M12 20V6.4M16.6 20v-9.4"/></svg>`,
	grid: `${open}<path d="M5.6 3.4h2.8a2.2 2.2 0 0 1 2.2 2.2v2.8a2.2 2.2 0 0 1 -2.2 2.2h-2.8a2.2 2.2 0 0 1 -2.2 -2.2v-2.8a2.2 2.2 0 0 1 2.2 -2.2zM15.6 3.4h2.8a2.2 2.2 0 0 1 2.2 2.2v2.8a2.2 2.2 0 0 1 -2.2 2.2h-2.8a2.2 2.2 0 0 1 -2.2 -2.2v-2.8a2.2 2.2 0 0 1 2.2 -2.2zM5.6 13.4h2.8a2.2 2.2 0 0 1 2.2 2.2v2.8a2.2 2.2 0 0 1 -2.2 2.2h-2.8a2.2 2.2 0 0 1 -2.2 -2.2v-2.8a2.2 2.2 0 0 1 2.2 -2.2zM15.6 13.4h2.8a2.2 2.2 0 0 1 2.2 2.2v2.8a2.2 2.2 0 0 1 -2.2 2.2h-2.8a2.2 2.2 0 0 1 -2.2 -2.2v-2.8a2.2 2.2 0 0 1 2.2 -2.2z"/></svg>`,

	// ic_heart, ic_lock, ic_mic, ic_palette, ic_cloud, ic_bookmark - settings and composer.
	heart: `${open}<path d="M12 20.4S3.6 15.6 3.6 9.8a4.8 4.8 0 0 1 8.4-3.2 4.8 4.8 0 0 1 8.4 3.2c0 5.8-8.4 10.6-8.4 10.6z"/></svg>`,
	lock: `${open}<path d="M8 10.4h8a3.2 3.2 0 0 1 3.2 3.2v3.4a3.2 3.2 0 0 1 -3.2 3.2h-8a3.2 3.2 0 0 1 -3.2 -3.2v-3.4a3.2 3.2 0 0 1 3.2 -3.2zM8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6"/></svg>`,
	mic: `${open}<path d="M12 3.2h0a2.6 2.6 0 0 1 2.6 2.6v5.2a2.6 2.6 0 0 1 -2.6 2.6h0a2.6 2.6 0 0 1 -2.6 -2.6v-5.2a2.6 2.6 0 0 1 2.6 -2.6zM5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8v3"/></svg>`,
	palette: `${open}<path d="M12 3.4a8.6 8.6 0 0 0 0 17.2c1.4 0 2.2-0.9 2.2-2 0-1-0.7-1.6-0.7-2.4 0-0.9 0.7-1.6 1.7-1.6h1.6a3.8 3.8 0 0 0 3.8-3.8c0-4.1-3.9-7.4-8.6-7.4zM6.75 11.2a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0zM9.35 7.4a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0zM14.15 8.4a1.05 1.05 0 1 0 2.1 0a1.05 1.05 0 1 0 -2.1 0z"/></svg>`,
	cloud: `${open}<path d="M7.4 18.6a4.4 4.4 0 0 1-0.5-8.77 5.6 5.6 0 0 1 10.75 1.37 3.7 3.7 0 0 1-0.65 7.4z"/></svg>`,
	bookmark: `${open}<path d="M6.6 3.8h10.8a1.6 1.6 0 0 1 1.6 1.6v14.8l-7-4.4-7 4.4V5.4a1.6 1.6 0 0 1 1.6-1.6z"/></svg>`,

	/*
	 * The solid variants.
	 *
	 * The app uses these for the selected state of a rail or tab item: same subject, filled
	 * instead of stroked. That is a stronger and cheaper selection signal than recolouring a
	 * stroke, because the weight changes as well as the hue, so it survives being viewed at a
	 * glance and by anyone who does not separate the two blues easily.
	 *
	 * Pair each with its stroke twin and switch on selection - never show both styles in one
	 * row for the same state.
	 */
	personSolid: `${solid}<path d="M12,3.2 a4.4,4.4 0 1,0 0.01,0 z M12,13.6 c-4.6,0 -8.4,2.7 -8.4,6.1 0,0.62 0.5,1.1 1.1,1.1 h14.6 c0.6,0 1.1,-0.48 1.1,-1.1 0,-3.4 -3.8,-6.1 -8.4,-6.1 z"/></svg>`,
	bellSolid: `${solid}<path d="M12,2.4 a5.8,5.8 0 0 1 5.8,5.8 c0,4.5 1.9,6.1 1.9,6.1 h-15.4 c0,0 1.9,-1.6 1.9,-6.1 a5.8,5.8 0 0 1 5.8,-5.8 z M9.85,15.8 h4.3 a2.15,2.15 0 0 1 -4.3,0 z"/></svg>`,
	globeSolid: `${solid}<path d="M12,2.6 a9.4,9.4 0 1,0 0.01,0 z M12,2.6 a5.0,9.4 0 1,0 0.01,0 z M12,3.65 a3.95,8.35 0 1,0 0.01,0 z M12,11.3 a9.35,0.7 0 1,0 0.01,0 z"/></svg>`,
	cardSolid: `${solid}<path d="M5.6,5.0 h12.8 a3.4,3.4 0 0 1 3.4,3.4 v7.2 a3.4,3.4 0 0 1 -3.4,3.4 h-12.8 a3.4,3.4 0 0 1 -3.4,-3.4 v-7.2 a3.4,3.4 0 0 1 3.4,-3.4 z M2.6,9.3 h18.8 v2.2 h-18.8 z M6.2,14.3 h3.8 v1.7 h-3.8 z"/></svg>`,
	databaseSolid: `${solid}<path d="M12,3.2 c3.98,0 7.2,1.34 7.2,3.0 0,1.66 -3.22,3.0 -7.2,3.0 -3.98,0 -7.2,-1.34 -7.2,-3.0 0,-1.66 3.22,-3.0 7.2,-3.0 z M4.8,8.9 c1.6,1.2 4.3,1.85 7.2,1.85 2.9,0 5.6,-0.65 7.2,-1.85 v3.3 c-1.6,1.2 -4.3,1.85 -7.2,1.85 -2.9,0 -5.6,-0.65 -7.2,-1.85 z M4.8,14.5 c1.6,1.2 4.3,1.85 7.2,1.85 2.9,0 5.6,-0.65 7.2,-1.85 v3.3 c0,1.66 -3.22,3.0 -7.2,3.0 -3.98,0 -7.2,-1.34 -7.2,-3.0 z"/></svg>`,
	helpSolid: `${solid}<path d="M12,2.6 a9.4,9.4 0 1,0 0.01,0 z M12.15,5.9 c-2.3,0 -3.9,1.3 -4.3,3.3 l2.0,0.4 c0.25,-1.1 1.0,-1.75 2.25,-1.75 1.2,0 2.0,0.7 2.0,1.7 0,0.8 -0.4,1.3 -1.35,1.95 -1.2,0.82 -1.72,1.6 -1.67,2.95 l0.02,0.55 h2.0 l-0.02,-0.45 c-0.05,-0.85 0.22,-1.3 1.12,-1.9 1.35,-0.9 2.0,-1.8 2.0,-3.2 0,-2.05 -1.7,-3.55 -4.05,-3.55 z M12.05,15.7 a1.3,1.3 0 1,0 0.01,0 z"/></svg>`,
	imageSolid: `${solid}<path d="M6.2,4.4 h11.6 a3.4,3.4 0 0 1 3.4,3.4 v8.4 a3.4,3.4 0 0 1 -3.4,3.4 h-11.6 a3.4,3.4 0 0 1 -3.4,-3.4 v-8.4 a3.4,3.4 0 0 1 3.4,-3.4 z M9.0,9.4 a1.9,1.9 0 1,0 0.01,0 z M5.0,17.6 l4.3,-4.5 2.6,2.4 3.2,-3.0 4.0,5.1 z"/></svg>`,
	moonSolid: `${solid}<path d="M20.4,14.6 A8.6,8.6 0 0 1 9.4,3.6 a8.8,8.8 0 1 0 11,11 z"/></svg>`,
	powerSolid: `${solid}<path d="M12,3.8 a8.2,8.2 0 1,0 0.01,0 z M12,6.0 a6.0,6.0 0 1,0 0.01,0 z M10.6,3.95 h2.8 v1.95 h-2.8 z"/><path d="M10.85,2.6 h2.3 a1.15,1.15 0 0 1 1.15,1.15 v7.0 a1.15,1.15 0 0 1 -1.15,1.15 h-2.3 a1.15,1.15 0 0 1 -1.15,-1.15 v-7.0 a1.15,1.15 0 0 1 1.15,-1.15 z"/></svg>`,
	logoutSolid: `${solid}<path d="M15.2,3.4 h3.2 a2.8,2.8 0 0 1 2.8,2.8 v11.6 a2.8,2.8 0 0 1 -2.8,2.8 h-3.2 a1.15,1.15 0 0 1 0,-2.3 h3.2 a0.5,0.5 0 0 0 0.5,-0.5 v-11.6 a0.5,0.5 0 0 0 -0.5,-0.5 h-3.2 a1.15,1.15 0 0 1 0,-2.3 z M2.6,10.85 h8.4 v2.3 h-8.4 a1.15,1.15 0 0 1 0,-2.3 z M10.1,7.85 l4.15,4.15 -4.15,4.15 z"/></svg>`,
	monitorSolid: `${solid}<path d="M3.4,4.0 h17.2 a1.7,1.7 0 0 1 1.7,1.7 v9.9 a1.7,1.7 0 0 1 -1.7,1.7 h-17.2 a1.7,1.7 0 0 1 -1.7,-1.7 v-9.9 a1.7,1.7 0 0 1 1.7,-1.7 z M9.6,18.4 h4.8 l0.35,1.7 h-5.5 z M7.4,20.0 h9.2 a0.95,0.95 0 0 1 0,1.9 h-9.2 a0.95,0.95 0 0 1 0,-1.9 z"/></svg>`,
	// Concentric rings. This is the glyph that proves the evenodd rule above: under nonzero it
	// renders as a plain filled circle and nobody notices it is wrong until they compare.
	broadcastSolid: `${solid}<path d="M12,2.4 a9.6,9.6 0 1,0 0.01,0 z M12,3.6 a8.4,8.4 0 1,0 0.01,0 z M12,5.4 a6.6,6.6 0 1,0 0.01,0 z M12,6.6 a5.4,5.4 0 1,0 0.01,0 z M12,9.6 a2.4,2.4 0 1,0 0.01,0 z"/></svg>`,

	// ic_nav_mail_filled / ic_nav_call_filled - the selected states in the tab bar. chat and
	// social have no separate filled entry here because the versions above are already the
	// app's own traced artwork.
	mailFilled: `${solid}<path d="M6.2 5h11.6a3.4 3.4 0 0 1 3.4 3.4v7.2a3.4 3.4 0 0 1 -3.4 3.4h-11.6a3.4 3.4 0 0 1 -3.4 -3.4v-7.2a3.4 3.4 0 0 1 3.4 -3.4zM4.05 7.55 10.9 12.1a2 2 0 0 0 2.2 0l6.85-4.55 1.1 1.7-6.85 4.55a4 4 0 0 1-4.4 0L2.95 9.25z"/></svg>`,
	callFilled: `${solid}<path d="M8.5 4.2 10.6 8a1.6 1.6 0 0 1-0.3 1.9l-1.4 1.3a12.4 12.4 0 0 0 4 4l1.3-1.4a1.6 1.6 0 0 1 1.9-0.3l3.8 2.1a1.7 1.7 0 0 1 0.8 1.9l-0.5 1.9a2.2 2.2 0 0 1-2.4 1.6C11.4 20.2 3.8 12.6 3 5.8A2.2 2.2 0 0 1 4.6 3.4l1.9-0.5a1.7 1.7 0 0 1 2 0.8z"/></svg>`,

	// ic_wifi_solid, ic_window_solid, ic_zap_solid, ic_rocket_solid - connection state, the
	// pairing card, the plan upsell, and onboarding.
	wifi: `${solid}<path d="M0.69,10.08 A13.8,13.8 0 0 1 23.31,10.08 L21.67,11.23 A11.8,11.8 0 0 0 2.33,11.23 Z M5.28,13.30 A8.2,8.2 0 0 1 18.72,13.30 L17.08,14.44 A6.2,6.2 0 0 0 6.92,14.44 Z M12,15.7 a2.3,2.3 0 1,0 0.01,0 z"/></svg>`,
	window: `${solid}<path d="M6,3.4 H18 A3.6,3.6 0 0 1 21.6,7 V17 A3.6,3.6 0 0 1 18,20.6 H6 A3.6,3.6 0 0 1 2.4,17 V7 A3.6,3.6 0 0 1 6,3.4 Z M4.2,9.7 V17 A1.8,1.8 0 0 0 6,18.8 H18 A1.8,1.8 0 0 0 19.8,17 V9.7 Z M6.5,5.75 a0.8,0.8 0 1,0 0.01,0 z M9.3,5.75 a0.8,0.8 0 1,0 0.01,0 z M12.1,5.75 a0.8,0.8 0 1,0 0.01,0 z"/></svg>`,
	zap: `${solid}<path d="M13.9,1.9 L5.3,13.1 a0.7,0.7 0 0 0 0.55,1.13 h4.3 l-0.45,7.9 a0.55,0.55 0 0 0 0.98,0.37 L18.7,11.3 a0.7,0.7 0 0 0 -0.55,-1.13 h-4.3 l0.45,-7.9 a0.55,0.55 0 0 0 -0.4,-0.37 z"/></svg>`,
	rocket: `${solid}<path d="M12,1.6 C15.25,4.5 17,8.5 17,12.6 V15 l-1.9,1.5 H8.9 L7,15 V12.6 C7,8.5 8.75,4.5 12,1.6 Z M12,6.6 a2.05,2.05 0 1,0 0.01,0 z M6.1,11.2 L3.5,14.1 a1.4,1.4 0 0 0 -0.35,0.92 V18.2 l2.95,-2.35 Z M17.9,11.2 v4.65 l2.95,2.35 V15.02 a1.4,1.4 0 0 0 -0.35,-0.92 Z M10.15,18 h3.7 L12,22.4 Z"/></svg>`,
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
