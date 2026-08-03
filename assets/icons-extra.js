/*
 * Icons the console does not currently render.
 *
 * These are not dead artwork, they are inventory. Every one is drawn to the same 2px / 24x24
 * rules as the live set, so adding a page or an empty state is a matter of importing a name
 * rather than drawing a glyph and hoping it matches. They live in their own file so that the
 * console's initial parse only covers what it actually paints.
 *
 * To use one: move the entry back into icons.js. Do not import this file from console.js,
 * which would defeat the split.
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


export const ICONS_EXTRA = {
	search: `${open}<circle cx="10.8" cy="10.8" r="6.8"/><path d="m15.8 15.8 4.2 4.2"/></svg>`,
	sweep: `${open}<path d="M4 20 11.4 12.6"/><path d="m14.6 4.4 5 5-4.4 4.4-5-5z"/><path d="M16.4 16.8h3.6M13.4 20h6.6"/></svg>`,
	shield: `${open}<path d="M12 3.2 5.2 5.9v5.3c0 4.3 2.9 8.2 6.8 9.4 3.9-1.2 6.8-5.1 6.8-9.4V5.9Z"/><path d="m9.2 11.9 2 2 3.6-3.7"/></svg>`,
	whatsapp: `${solid}<path d="M7.48,7.59L7.18,7.99L6.96,8.43L6.78,9.04L6.74,9.74L6.96,10.75L7.53,11.89L8.32,12.99L9.06,13.86L10.07,14.83L11.12,15.62L12.18,16.19L13.05,16.54L14.28,16.89L15.24,16.89L15.77,16.76L16.56,16.32L17,15.88L17.17,15.53L17.26,15.18L17.3,14.43L17.13,14.26L15.33,13.38L14.89,13.21L14.54,13.25L13.71,14.3L13.49,14.52L13.23,14.56L12.18,14.08L10.99,13.25L10.16,12.37L9.41,11.28L9.46,10.97L10.16,10.09L10.29,9.83L10.29,9.65L9.37,7.42L9.15,7.16L9.02,7.11L8.14,7.11L7.79,7.29ZM18.88,4.04L18.05,3.39L17.3,2.9L16.38,2.42L14.98,1.89L13.58,1.59L12.7,1.5L11.3,1.5L10.25,1.63L9.28,1.85L8.45,2.11L7.62,2.46L6.78,2.9L6.04,3.39L5.25,4L4.55,4.66L3.89,5.4L2.97,6.76L2.27,8.25L1.78,9.96L1.61,11.54L1.61,12.28L1.74,13.6L1.96,14.61L2.27,15.57L3.01,17.2L1.78,21.54L1.57,22.5L7,21.05L8.58,21.75L10.03,22.15L11.39,22.32L12.66,22.32L13.8,22.19L14.94,21.93L15.73,21.67L17.13,21.01L18.66,19.96L19.8,18.86L20.51,17.98L20.94,17.33L21.6,16.06L21.86,15.4L22.22,14.17L22.39,13.16L22.43,11.15L22.17,9.44L21.82,8.3L21.51,7.55L21.03,6.63L20.55,5.88L19.89,5.05ZM17.7,5.31L18.62,6.23L19.01,6.72L19.54,7.51L19.94,8.25L20.42,9.57L20.59,10.31L20.72,11.41L20.72,12.42L20.64,13.25L20.46,14.08L20.2,14.92L19.37,16.58L18.53,17.68L17.48,18.69L16.25,19.52L14.76,20.18L13.27,20.53L11.87,20.61L10.29,20.44L8.93,20.04L8.14,19.69L7.35,19.21L4.06,20.04L4.02,19.91L4.9,16.84L4.46,16.19L4.06,15.4L3.58,13.99L3.36,12.68L3.41,10.79L3.58,9.83L4.02,8.51L4.81,7.07L5.77,5.88L6.87,4.92L7.66,4.39L8.32,4.04L9.9,3.47L10.77,3.3L11.65,3.25L11.69,3.21L13.32,3.3L14.19,3.47L15.16,3.78L16.43,4.39Z"/></svg>`,

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

	// ic_wifi_solid, ic_window_solid, ic_zap_solid, ic_rocket_solid - connection state, the
	// pairing card, the plan upsell, and onboarding.
	wifi: `${solid}<path d="M0.69,10.08 A13.8,13.8 0 0 1 23.31,10.08 L21.67,11.23 A11.8,11.8 0 0 0 2.33,11.23 Z M5.28,13.30 A8.2,8.2 0 0 1 18.72,13.30 L17.08,14.44 A6.2,6.2 0 0 0 6.92,14.44 Z M12,15.7 a2.3,2.3 0 1,0 0.01,0 z"/></svg>`,
	window: `${solid}<path d="M6,3.4 H18 A3.6,3.6 0 0 1 21.6,7 V17 A3.6,3.6 0 0 1 18,20.6 H6 A3.6,3.6 0 0 1 2.4,17 V7 A3.6,3.6 0 0 1 6,3.4 Z M4.2,9.7 V17 A1.8,1.8 0 0 0 6,18.8 H18 A1.8,1.8 0 0 0 19.8,17 V9.7 Z M6.5,5.75 a0.8,0.8 0 1,0 0.01,0 z M9.3,5.75 a0.8,0.8 0 1,0 0.01,0 z M12.1,5.75 a0.8,0.8 0 1,0 0.01,0 z"/></svg>`,
	zap: `${solid}<path d="M13.9,1.9 L5.3,13.1 a0.7,0.7 0 0 0 0.55,1.13 h4.3 l-0.45,7.9 a0.55,0.55 0 0 0 0.98,0.37 L18.7,11.3 a0.7,0.7 0 0 0 -0.55,-1.13 h-4.3 l0.45,-7.9 a0.55,0.55 0 0 0 -0.4,-0.37 z"/></svg>`,
	rocket: `${solid}<path d="M12,1.6 C15.25,4.5 17,8.5 17,12.6 V15 l-1.9,1.5 H8.9 L7,15 V12.6 C7,8.5 8.75,4.5 12,1.6 Z M12,6.6 a2.05,2.05 0 1,0 0.01,0 z M6.1,11.2 L3.5,14.1 a1.4,1.4 0 0 0 -0.35,0.92 V18.2 l2.95,-2.35 Z M17.9,11.2 v4.65 l2.95,2.35 V15.02 a1.4,1.4 0 0 0 -0.35,-0.92 Z M10.15,18 h3.7 L12,22.4 Z"/></svg>`,
};
