/*
 * Support Chat Web — console.
 *
 * Pairing model, and why it looks like this.
 * ------------------------------------------
 * The backend is Firebase only, on the Spark plan: no Cloud Functions, no Admin SDK, so nothing
 * anywhere can mint a custom token. That rules out the literal WhatsApp Web design, where the
 * phone hands the browser a signed credential.
 *
 * What happens instead:
 *   1. The browser signs in ANONYMOUSLY and gets its own uid.
 *   2. It writes pairing/{sessionId} = { webUid, status: 'waiting' } and renders a QR holding
 *      "sc1:<sessionId>:<secret>". The secret is never written — it exists only on screen.
 *   3. The phone, already signed in as the tenant owner, scans it, then writes the approval:
 *      status -> 'approved', tenantId, and the secret it just read off the screen.
 *   4. The browser checks the secret it receives equals the one it generated. That is what stops
 *      somebody who guesses a sessionId from binding this browser to THEIR tenant.
 *   5. The phone also writes the grant: chats/{tenantId}/sessions/{webUid}. The security rules
 *      treat "owner uid" OR "a uid listed under sessions" as authorised, so from that moment the
 *      anonymous browser reads and writes exactly what the owner can, and not one tenant more.
 *
 * Revoking is deleting that node, which Storage and data does, and which the rules honour
 * immediately on the next read.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
	getAuth,
	signInAnonymously,
	onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
	getDatabase,
	ref,
	child,
	get as dbGet,
	set as dbSet,
	update as dbUpdate,
	remove as dbRemove,
	push as dbPush,
	onValue,
	query as dbQuery,
	orderByChild,
	onDisconnect,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import {
	getFirestore,
	doc,
	getDoc,
	setDoc,
	deleteDoc,
	collection,
	getDocs,
	query as fsQuery,
	orderBy,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

import { qrMatrix, drawQr } from './qr.js';
import { ICONS, avatarFor } from './icons.js';

// --------------------------------------------------------------- constants
const FIREBASE_CONFIG = {
	apiKey: 'AIzaSyBErf6PTxfu24t_UBIsoiH6hJdNFMQDzWM',
	authDomain: 'chat-support-1.firebaseapp.com',
	projectId: 'chat-support-1',
	databaseURL: 'https://chat-support-1-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const PAIR_TTL = 3 * 60 * 1000; // a QR is only good for three minutes
const STORE_KEY = 'supportchat.web.v1';
// Feature ids as the server writes them. These are matched by exact string, so they have to
// stay in step with FEATURE_* in functions/src/config.js.
const FEATURE_CHAT = 'chat';
const FEATURE_EMAIL = 'email_automation';
const FEATURE_SOCIAL = 'social_media';

// ------------------------------------------------------------------- state
const state = {
	convosLoaded: false,
	uid: null,
	tenantId: null,
	tenant: null,
	plans: [],
	leads: [],
	templates: [],
	website: null,
	conversations: [],
	messages: [],
	openId: null,
	filter: 'All',
	search: '',
	page: 'chats',
	online: true,
	pair: null,
	// Presence for this browser and the list of every browser holding a grant.
	presence: null,
	devices: [],
	unsubDevices: null,
	unsubConvos: null,
	unsubMsgs: null,
	sending: false,
};

let app;
let auth;
let db;
let fs;

// ---------------------------------------------------------------- helpers
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (text != null) n.textContent = text;
	return n;
};

function randomId(length) {
	const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	let out = '';
	for (const b of bytes) out += alphabet[b % alphabet.length];
	return out;
}

function escapeHtml(text) {
	return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
	}[c]));
}

function timeLabel(ms) {
	if (!ms) return '';
	const d = new Date(ms);
	const now = new Date();
	const sameDay = d.toDateString() === now.toDateString();
	if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	const yesterday = new Date(now.getTime() - 86400000);
	if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
	return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function dayLabel(ms) {
	const d = new Date(ms);
	const now = new Date();
	if (d.toDateString() === now.toDateString()) return 'Today';
	const yesterday = new Date(now.getTime() - 86400000);
	if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
	return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function toast(message) {
	const host = $('#toasts');
	const node = el('div', 'toast', message);
	host.appendChild(node);
	setTimeout(() => {
		node.classList.add('out');
		setTimeout(() => node.remove(), 280);
	}, 3000);
}

// ------------------------------------------------------------------ avatars
/*
 * The app's profile picture rule, in the browser.
 *
 * Google photo, then the first letter of the name, then the first letter of the email, then a
 * question mark. Website visitors have no photo and are all called "Website visitor", so the
 * letter collides for every one of them; the disc colour is seeded from the conversation id,
 * which is what actually tells them apart. Same input, same colour, on the phone and here.
 */
/**
 * The owner's picture, resolved in the same order the Android app resolves it.
 *
 * This is the parity bug that made the whole feature look broken. The app stores the picture the
 * owner picks as base64 JPEG on the Firestore tenant document, under `ownerPhoto`. This console
 * read `photoUrl` and `ownerPhotoUrl` and never looked at `ownerPhoto` at all - so a picture set
 * on the phone appeared on the phone, and the browser carried on showing a coloured letter
 * indefinitely. Nothing was failing and nothing was logged; the two surfaces were simply reading
 * different fields.
 *
 * The order matters and must stay identical to OwnerAvatar.kt:
 *
 *   1. ownerPhoto      the picture the owner deliberately chose. Always wins.
 *   2. photoUrl        whatever Google supplied at sign-in. A default, not a choice.
 *   3. null            the caller draws the coloured letter disc.
 *
 * The stored value is bare base64 with no data-URI prefix, because that is what the Firestore
 * field holds and adding a prefix on the phone would waste bytes in a 20 KB budget. The prefix is
 * added here instead, which is the only place it is needed.
 */
function ownerPhotoSrc(tenant) {
	if (!tenant) return '';
	const stored = String(tenant.ownerPhoto || '').trim();
	if (stored) {
		// Already a data URI or an http(s) URL? Use it untouched. Only bare base64 gets wrapped.
		if (/^(data:|https?:)/i.test(stored)) return stored;
		return 'data:image/jpeg;base64,' + stored;
	}
	return String(tenant.photoUrl || tenant.ownerPhotoUrl || '').trim();
}

function avatarLetter(name, email) {
	const fromName = String(name || '').trim().match(/[a-z0-9]/i);
	if (fromName) return fromName[0].toUpperCase();
	const fromEmail = String(email || '').trim().match(/[a-z0-9]/i);
	if (fromEmail) return fromEmail[0].toUpperCase();
	return '?';
}

/** A finished avatar disc: a photo when there is one, the letter when there is not. */
function avatarNode(cls, convo) {
	const node = el('span', cls, avatarLetter(convo.name, convo.email));
	node.style.background = avatarFor(convo.id);
	if (convo.photoUrl) {
		const img = document.createElement('img');
		img.src = convo.photoUrl;
		img.alt = '';
		// The letter stays underneath: a photo that never loads must not leave a blank disc.
		img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;position:absolute;inset:0';
		img.addEventListener('error', () => img.remove());
		node.style.position = 'relative';
		node.appendChild(img);
	}
	return node;
}

function stored() {
	try {
		return JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
	} catch (err) {
		return null;
	}
}

function storeSession(value) {
	if (value) localStorage.setItem(STORE_KEY, JSON.stringify(value));
	else localStorage.removeItem(STORE_KEY);
}

// ------------------------------------------------------------------ theme
function applyTheme(mode) {
	const resolved = mode || localStorage.getItem('supportchat.theme') || 'light';
	document.documentElement.dataset.theme = resolved;
	localStorage.setItem('supportchat.theme', resolved);
}

// ==========================================================================
// Pairing
// ==========================================================================
async function beginPairing() {
	const sessionId = randomId(22);
	const secret = randomId(24);
	const now = Date.now();

	state.pair = { sessionId, secret, expiresAt: now + PAIR_TTL, unsub: null };

	await dbSet(ref(db, `pairing/${sessionId}`), {
		webUid: state.uid,
		status: 'waiting',
		createdAt: now,
		expiresAt: now + PAIR_TTL,
		ua: navigator.userAgent.slice(0, 280),
	});
	// If this tab dies before it is claimed, do not leave the node lying around.
	onDisconnect(ref(db, `pairing/${sessionId}`)).remove();

	const canvas = $('#qr');
	drawQr(canvas, qrMatrix(`sc1:${sessionId}:${secret}`), { pixels: 264 });
	$('#qrVeil').classList.add('hidden');
	setStatus('Waiting for your phone…');

	const node = ref(db, `pairing/${sessionId}`);
	state.pair.unsub = onValue(node, async (snap) => {
		const value = snap.val();
		if (!value || value.status !== 'approved') return;

		if (value.secret !== secret) {
			// Somebody approved a session they could not have seen on this screen.
			setStatus('That pairing attempt did not match this screen. Generating a new code…', 'err');
			await dbRemove(node).catch(() => {});
			setTimeout(() => window.location.reload(), 2200);
			return;
		}
		if (!value.tenantId) return;

		state.pair.unsub();
		setStatus('Paired. Loading your workspace…', 'ok');
		await dbRemove(node).catch(() => {});
		storeSession({ tenantId: value.tenantId, uid: state.uid });
		enterConsole(value.tenantId);
	});

	// Expire the code on screen so a stale QR is never left scannable.
	setTimeout(() => {
		if (!state.tenantId) {
			$('#qrVeil').classList.remove('hidden');
			$('#qrVeil').textContent = 'This code expired. Click to get a new one.';
			$('#qrVeil').style.cursor = 'pointer';
			$('#qrVeil').onclick = () => window.location.reload();
			setStatus('Code expired.', 'err');
		}
	}, PAIR_TTL);
}

function setStatus(text, kind) {
	const node = $('#pairStatus');
	node.textContent = text;
	node.className = 'pair-status' + (kind ? ' ' + kind : '');
}

/** Reconnect a browser that has paired before, if the grant is still in place. */
async function resumeSession() {
	const saved = stored();
	if (!saved || !saved.tenantId || saved.uid !== state.uid) return false;
	try {
		const snap = await dbGet(ref(db, `chats/${saved.tenantId}/sessions/${state.uid}`));
		if (!snap.exists()) {
			storeSession(null);
			return false;
		}
		enterConsole(saved.tenantId);
		return true;
	} catch (err) {
		storeSession(null);
		return false;
	}
}

// ==========================================================================
// Loading
// ==========================================================================
/*
 * Scanning the QR used to hand straight over to the shell, which meant the first thing a newly
 * paired browser showed was an empty inbox, a blank workspace name and a drawer with no counts,
 * all of which filled in a second later. This holds that window shut until the data is here.
 *
 * MIN is a floor as much as MAX is a ceiling: a loading screen that disappears in 80ms reads as
 * a flicker, and MAX exists so a browser that cannot reach the database still reaches the app.
 */
const LOAD_MIN_MS = 650;
const LOAD_MAX_MS = 6000;

function showLoading(on) {
	const node = $('#loading');
	if (!node) return;
	if (on) {
		node.classList.remove('hidden');
		node.style.opacity = '1';
		return;
	}
	node.style.transition = 'opacity 260ms ease';
	node.style.opacity = '0';
	setTimeout(() => node.classList.add('hidden'), 280);
}

function untilLoaded() {
	return new Promise((resolve) => {
		const startedAt = Date.now();
		const tick = () => {
			const waited = Date.now() - startedAt;
			if (waited >= LOAD_MAX_MS) return resolve();
			if (state.convosLoaded && waited >= LOAD_MIN_MS) return resolve();
			setTimeout(tick, 60);
		};
		tick();
	});
}

// ==========================================================================
// Console boot
// ==========================================================================
async function enterConsole(tenantId) {
	state.tenantId = tenantId;
	$('#pairing').classList.add('hidden');
	showLoading(true);
	$('#shell').classList.remove('hidden');

	// Neither is awaited: the console should paint whether or not the grant node has landed
	// yet, and startPresence may sit waiting for it for several seconds. See startPresence.
	startPresence(tenantId);
	watchDevices(tenantId);

	watchConnection();
	watchConversations();
	await loadTenant();
	renderRail();
	showPage(state.page);

	// The shell is built and painted underneath by this point; the reveal is the last thing.
	await untilLoaded();
	renderRail();
	if (state.page === 'chats') renderInbox();
	showLoading(false);
}

// ==========================================================================
// Presence, and the list of paired browsers
// ==========================================================================
/*
 * "Permission denied: missing or insufficient permissions", and where it came from.
 *
 * enterConsole used to take a ref to chats/{tenant}/sessions/{uid}/lastSeenAt, write it at
 * once, and arm a 60s interval on the same ref. A freshly paired browser threw on all three.
 *
 * It is a race, not a rules bug. The phone makes two separate writes when it approves a scan:
 * the approval on pairing/{sessionId}, and the grant at chats/{tenant}/sessions/{uid}. The
 * console reacts to the approval the instant it appears, so it routinely reached the grant
 * path first and tried to write a child of a node that did not exist yet. The rules authorise
 * a uid only once it is listed under sessions, so the write was refused, correctly. The
 * interval then repeated that refused write every minute for the life of the tab, which is
 * why the error kept reappearing long after pairing had visibly succeeded.
 *
 * So: wait for the grant to exist before writing anything, and arm the interval only after a
 * write has actually gone through.
 */
const PRESENCE_MILLIS = 60000;
const GRANT_TRIES = 12;
const GRANT_WAIT_MILLIS = 500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A short human name for a browser, read off its user agent. */
function deviceLabel(ua) {
	const agent = ua || '';
	let browser = 'Browser';
	if (/Edg\//.test(agent)) browser = 'Edge';
	else if (/OPR\/|Opera/.test(agent)) browser = 'Opera';
	else if (/Firefox\//.test(agent)) browser = 'Firefox';
	else if (/Chrome\//.test(agent)) browser = 'Chrome';
	else if (/Safari\//.test(agent)) browser = 'Safari';

	let os = 'Computer';
	if (/Windows/.test(agent)) os = 'Windows';
	else if (/Macintosh|Mac OS X/.test(agent)) os = 'macOS';
	else if (/Android/.test(agent)) os = 'Android';
	else if (/iPhone|iPad|iPod/.test(agent)) os = 'iPhone';
	else if (/CrOS/.test(agent)) os = 'ChromeOS';
	else if (/Linux/.test(agent)) os = 'Linux';

	return browser + ' on ' + os;
}

/** "Active now" / "12 minutes ago" / a date, for a lastSeenAt stamp. */
function lastSeenText(at) {
	if (!at) return 'Never used';
	const gap = Date.now() - at;
	if (gap < 2 * PRESENCE_MILLIS) return 'Active now';
	const mins = Math.round(gap / 60000);
	if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
	const hours = Math.round(mins / 60);
	if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
	const days = Math.round(hours / 24);
	if (days < 7) return days + (days === 1 ? ' day ago' : ' days ago');
	return new Date(at).toLocaleDateString();
}

/**
 * Announce this browser, then keep the grant warm.
 *
 * The description (ua, label) is written here rather than by the phone because the phone
 * cannot know what it just paired with. Without it the devices list can only say "a browser".
 */
async function startPresence(tenantId) {
	const path = `chats/${tenantId}/sessions/${state.uid}`;
	const node = ref(db, path);

	let granted = false;
	for (let attempt = 0; attempt < GRANT_TRIES; attempt++) {
		try {
			const snap = await dbGet(node);
			if (snap.exists()) {
				granted = true;
				break;
			}
		} catch (err) {
			// A denied read here means the same thing as an absent one: the grant is not
			// visible to this uid yet. Both are worth another try.
		}
		await wait(GRANT_WAIT_MILLIS);
	}
	// Give up quietly. The console is already usable, and shouting about presence in a toast
	// would be reporting an internal detail the operator cannot act on.
	if (!granted) return;

	const stamp = Date.now();
	try {
		await dbUpdate(node, {
			lastSeenAt: stamp,
			ua: navigator.userAgent.slice(0, 280),
			label: deviceLabel(navigator.userAgent),
		});
	} catch (err) {
		return;
	}

	const seen = ref(db, path + '/lastSeenAt');
	if (state.presence) clearInterval(state.presence);
	state.presence = setInterval(() => dbSet(seen, Date.now()).catch(() => {}), PRESENCE_MILLIS);
	// Leave a truthful stamp behind if the tab closes, instead of a time frozen mid-session.
	onDisconnect(seen).set(Date.now());
}

/**
 * Watch every browser paired to this tenant.
 *
 * Used by the console and, before sign-in, by the pairing screen, so that somebody on a shared
 * computer can revoke a browser they left logged in without having to log in first.
 */
function watchDevices(tenantId, options) {
	const opts = options || {};
	if (state.unsubDevices) state.unsubDevices();
	state.unsubDevices = onValue(
		ref(db, `chats/${tenantId}/sessions`),
		(snap) => {
			const rows = [];
			snap.forEach((session) => {
				const value = session.val() || {};
				rows.push({
					uid: session.key,
					label: value.label || deviceLabel(value.ua),
					lastSeenAt: value.lastSeenAt || value.grantedAt || 0,
					thisOne: session.key === state.uid,
				});
			});
			rows.sort((a, b) => (b.thisOne ? 1 : 0) - (a.thisOne ? 1 : 0) || b.lastSeenAt - a.lastSeenAt);
			state.devices = rows;
			if (opts.pairing) paintPairDevices();
			else if (state.page === 'settings') paintDeviceList();
		},
		() => {
			// Denied, which on the pairing screen is the ordinary case: this browser has no
			// grant, so it cannot enumerate the tenant's others. Show nothing rather than an
			// error about a feature the visitor did not ask for.
			state.devices = [];
			if (opts.pairing) paintPairDevices();
			else if (state.page === 'settings') paintDeviceList();
		},
	);
}

/** One row per paired browser. Shared by the settings card and the pairing screen. */
function deviceRowsHtml() {
	if (!state.devices.length) {
		return '<div class="row"><div class="row-main"><b>No other browsers</b>' +
			'<span>Only this one is paired.</span></div></div>';
	}
	return state.devices.map((device) => {
		const sub = lastSeenText(device.lastSeenAt) + (device.thisOne ? ' · This browser' : '');
		return '<div class="row device">' +
			`<span class="row-tile" style="background:${SETTING_TINTS.purple}">${ICONS.monitor}</span>` +
			`<div class="row-main"><b>${escapeHtml(device.label)}</b><span>${escapeHtml(sub)}</span></div>` +
			`<button class="btn danger sm" data-revoke="${escapeHtml(device.uid)}">Log out</button>` +
			'</div>';
	}).join('');
}

/** Revoke one browser by deleting its grant. The rules honour that on the next read. */
async function revokeDevice(uid) {
	try {
		await dbRemove(ref(db, `chats/${state.tenantId}/sessions/${uid}`));
	} catch (err) {
		toast('Could not log that browser out.');
		return;
	}
	if (uid === state.uid) {
		storeSession(null);
		location.reload();
		return;
	}
	toast('That browser has been logged out.');
}

function wireDeviceButtons(root) {
	for (const button of root.querySelectorAll('[data-revoke]')) {
		button.onclick = () => revokeDevice(button.dataset.revoke);
	}
}

function paintDeviceList() {
	const host = $('#deviceList');
	if (!host) return;
	host.innerHTML = deviceRowsHtml();
	wireDeviceButtons(host);
}

function paintPairDevices() {
	const wrap = $('#pairDevices');
	const host = $('#pairDeviceList');
	if (!wrap || !host) return;
	// Hidden entirely when there is nothing to manage, so the login screen stays a login
	// screen for the ordinary first-time visitor.
	wrap.classList.toggle('hidden', state.devices.length === 0);
	host.innerHTML = deviceRowsHtml();
	wireDeviceButtons(host);
}

function watchConnection() {
	onValue(ref(db, '.info/connected'), (snap) => {
		state.online = snap.val() === true;
		const pill = $('#connPill');
		pill.classList.toggle('off', !state.online);
		$('#connText').textContent = state.online ? 'Connected' : 'Reconnecting';
	});
}

async function loadTenant() {
	try {
		const snap = await getDoc(doc(fs, 'tenants', state.tenantId));
		state.tenant = snap.exists() ? snap.data() : null;
	} catch (err) {
		state.tenant = null;
	}
	try {
		const websites = await getDocs(collection(fs, 'tenants', state.tenantId, 'websites'));
		state.website = websites.empty ? null : { id: websites.docs[0].id, ...websites.docs[0].data() };
	} catch (err) {
		state.website = null;
	}
}

// ==========================================================================
// Live chat data
// ==========================================================================
function watchConversations() {
	if (state.unsubConvos) state.unsubConvos();
	const node = dbQuery(
		ref(db, `chats/${state.tenantId}/conversations`),
		orderByChild('lastMessage/at'),
	);
	state.unsubConvos = onValue(
		node,
		(snap) => {
			const rows = [];
			snap.forEach((c) => {
				const v = c.val() || {};
				const visitor = v.visitor || {};
				rows.push({
					id: c.key,
					status: v.status || 'open',
					assignedAgentUid: v.assignedAgentUid || null,
					unread: Number(v.unread || 0),
					lastText: (v.lastMessage && v.lastMessage.text) || '',
					lastSender: (v.lastMessage && v.lastMessage.sender) || '',
					lastAt: Number((v.lastMessage && v.lastMessage.at) || v.createdAt || 0),
					createdAt: Number(v.createdAt || 0),
					name: visitor.name || 'Website visitor',
					email: visitor.email || '',
					pageUrl: visitor.pageUrl || '',
				});
			});
			rows.reverse(); // newest first
			state.conversations = rows;
			state.convosLoaded = true;
			if (state.page === 'chats') renderInbox();
			renderRail();
		},
		() => {
			// Also mark it loaded on failure, or the loading screen would sit there forever on a
			// revoked pairing instead of letting the error through.
			state.convosLoaded = true;
			toast('Could not read conversations. The pairing may have been revoked.');
		},
	);
}

function watchMessages(conversationId) {
	if (state.unsubMsgs) state.unsubMsgs();
	state.messages = [];
	const node = dbQuery(
		ref(db, `chats/${state.tenantId}/messages/${conversationId}`),
		orderByChild('createdAt'),
	);
	state.unsubMsgs = onValue(node, (snap) => {
		const rows = [];
		snap.forEach((m) => {
			const v = m.val() || {};
			rows.push({
				id: m.key,
				sender: v.sender || 'visitor',
				// 'bot' when the reply was automated. Read defensively: the widget currently
				// keeps bot replies on the visitor's device and never writes them here, so
				// this is usually absent. It is read so that the console draws them correctly
				// the moment they do start being persisted.
				kind: v.kind || v.author || '',
				text: v.text || '',
				createdAt: Number(v.createdAt || 0),
				readAt: v.readAt ? Number(v.readAt) : null,
			});
		});
		state.messages = rows;
		renderThread();
		markRead(conversationId);
	});
}

/*
 * The "seen here is seen there" half of the request.
 *
 * Both surfaces write the SAME two things when a thread is on screen: the conversation's unread
 * counter goes to zero, and every visitor message that has no readAt gets one. Neither surface
 * owns the flag, so whichever looks first clears it, and the other redraws from the RTDB event a
 * moment later without being told anything directly.
 */
async function markRead(conversationId) {
	const convo = state.conversations.find((c) => c.id === conversationId);
	const updates = {};
	const base = `chats/${state.tenantId}`;

	if (!convo || convo.unread > 0) {
		updates[`${base}/conversations/${conversationId}/unread`] = 0;
	}
	const now = Date.now();
	for (const m of state.messages) {
		if (m.sender === 'visitor' && !m.readAt) {
			updates[`${base}/messages/${conversationId}/${m.id}/readAt`] = now;
		}
	}
	if (Object.keys(updates).length === 0) return;
	try {
		await dbUpdate(ref(db), updates);
	} catch (err) {
		/* A closed or purged thread can reject this; it is not worth interrupting the agent. */
	}
}

async function sendMessage(text) {
	const body = text.trim();
	if (!body || !state.openId || state.sending) return;
	state.sending = true;
	const conversationId = state.openId;
	const now = Date.now();
	const base = `chats/${state.tenantId}`;
	const key = dbPush(ref(db, `${base}/messages/${conversationId}`)).key;

	try {
		await dbUpdate(ref(db), {
			[`${base}/messages/${conversationId}/${key}`]: {
				sender: 'agent',
				text: body,
				createdAt: now,
			},
			[`${base}/conversations/${conversationId}/lastMessage`]: {
				text: body.slice(0, 4000),
				sender: 'agent',
				at: now,
			},
			[`${base}/conversations/${conversationId}/unreadForVisitor`]: 1,
		});
	} catch (err) {
		toast('Message not sent. Check the connection and try again.');
	} finally {
		state.sending = false;
	}
}

async function setStatusOf(conversationId, status) {
	try {
		const updates = { [`chats/${state.tenantId}/conversations/${conversationId}/status`]: status };
		if (status === 'open') {
			updates[`chats/${state.tenantId}/conversations/${conversationId}/startedAt`] = Date.now();
		}
		await dbUpdate(ref(db), updates);
		if (status === 'open') {
			// Mirrors the app's Start chat, so the visitor sees the same confirmation line.
			const base = `chats/${state.tenantId}`;
			const key = dbPush(ref(db, `${base}/messages/${conversationId}`)).key;
			const now = Date.now();
			await dbUpdate(ref(db), {
				[`${base}/messages/${conversationId}/${key}`]: {
					sender: 'system',
					text: 'Customer care connected.',
					createdAt: now,
				},
				[`${base}/conversations/${conversationId}/lastMessage`]: {
					text: 'Customer care connected.',
					sender: 'system',
					at: now,
				},
			});
		}
		toast(status === 'closed' ? 'Conversation closed.' : 'Chat started.');
	} catch (err) {
		toast('Could not update that conversation.');
	}
}

// ==========================================================================
// Navigation
// ==========================================================================
/*
 * The same core areas as the app, nothing else.
 *
 * `rail: true` marks the destinations that get a permanent button. Help is reachable from the
 * Settings list exactly as it is on the phone, so it does not need one, and giving it a rail
 * slot would put a section in the browser's primary navigation that the app keeps two levels
 * down. Email automation is gone entirely: there is no such screen in the app, so under the
 * rule that the browser shows only what the phone shows, it had no reason to exist.
 */
const PAGES = [
	{ id: 'chats',      label: 'Chats',            icon: 'chat',     rail: true },
	{ id: 'emails',     label: 'Email',            icon: 'mail',     rail: true, feature: FEATURE_EMAIL },
	{ id: 'social',     label: 'Social media',     icon: 'social',   rail: true, feature: FEATURE_SOCIAL },
	{ id: 'settings',   label: 'Settings',         icon: 'settings' },
	{ id: 'help',       label: 'Help and contact', icon: 'help' },
];

/*
 * Which features each plan carries.
 *
 * This mirrors PLANS in functions/src/seed.js. The console reads Firestore directly and has no
 * route to the plans collection, so the catalogue has to be restated here; if a plan's contents
 * change in the seed, change them here too.
 *
 * Ultimate lists the concrete features next to the wildcard for the same reason the seed does:
 * a membership test against a list holding only "*" fails every specific check, which is one of
 * the ways an Ultimate customer can be told they own nothing.
 */
const PLAN_FEATURES = {
	free:   [FEATURE_CHAT],
	plan_1: [FEATURE_CHAT],
	plan_2: [FEATURE_CHAT, FEATURE_EMAIL],
	plan_3: [FEATURE_CHAT, FEATURE_EMAIL, FEATURE_SOCIAL],
	plan_4: [FEATURE_CHAT, FEATURE_EMAIL, FEATURE_SOCIAL, '*'],
	// The catalogue is keyed by id, but tenant.plan has been seen holding the display name, so
	// both spellings resolve.
	starter:  [FEATURE_CHAT],
	growth:   [FEATURE_CHAT, FEATURE_EMAIL],
	scale:    [FEATURE_CHAT, FEATURE_EMAIL, FEATURE_SOCIAL],
	ultimate: [FEATURE_CHAT, FEATURE_EMAIL, FEATURE_SOCIAL, '*'],
};

/*
 * Everything this workspace owns.
 *
 * The union of two sources, on purpose. features[] copied onto the tenant document is the
 * server's own answer and is the more authoritative of the two, but it is a snapshot taken at
 * activation: a tenant written before the catalogue changed, or by a path that set plan without
 * re-copying the list, carries a stale array. Reading tenant.plan through the catalogue covers
 * that case. Taking the union means a workspace is only locked out of something when both
 * sources agree it does not own it, which is the correct bias for a paying customer.
 */
function ownedFeatures() {
	const tenant = state.tenant || {};
	const owned = new Set();

	if (Array.isArray(tenant.features)) {
		for (const entry of tenant.features) {
			if (typeof entry === 'string' && entry.trim()) owned.add(entry.trim());
		}
	}

	const key = String(tenant.plan || '').trim().toLowerCase();
	for (const entry of PLAN_FEATURES[key] || []) owned.add(entry);

	return owned;
}

function renderRail() {
	const top = $('#railTop');
	const foot = $('#railFoot');
	if (!top || !foot) return;
	top.innerHTML = '';
	foot.innerHTML = '';

	const pending = state.conversations.filter((c) => c.status === 'pending').length;
	const unread = state.conversations.reduce((sum, c) => sum + (c.unread > 0 ? 1 : 0), 0);

	const button = (page) => {
		const btn = el('button', 'rail-btn' + (state.page === page.id ? ' active' : ''));
		btn.type = 'button';
		// Icons only, so the label has to survive as the accessible name and as the tooltip.
		// Without both, an icon rail is a row of unlabelled squares to a screen reader and a
		// guessing game to everyone else on their first visit.
		btn.title = page.label;
		btn.setAttribute('aria-label', page.label);
		btn.innerHTML = ICONS[page.icon] || ICONS.chat;
		const count = page.id === 'chats' ? unread + pending : 0;
		if (count > 0) btn.appendChild(el('span', 'rail-badge', String(count)));
		btn.onclick = () => showPage(page.id);
		return btn;
	};

	for (const page of PAGES) {
		if (page.rail) top.appendChild(button(page));
	}
	foot.appendChild(button(PAGES.find((p) => p.id === 'settings')));

	// The workspace avatar is pinned to the bottom, under the settings button, the way the
	// reference does it. It is an identity marker rather than a control, so it is not a button.
	const name = (state.tenant && (state.tenant.companyName || state.tenant.ownerName)) || '';
	const mail = (state.tenant && state.tenant.email) || '';
	const photo = ownerPhotoSrc(state.tenant);
	const chip = el('span', 'rail-me', photo ? '' : avatarLetter(name, mail));
	chip.title = name || mail || 'Paired browser';

	if (photo) {
		/*
		 * The owner's picture, so the rail matches the account row in the app. Usually this is
		 * now the base64 value the owner chose on the phone, which is inline and therefore works
		 * offline; when it is the Google URL instead it is a remote image on a console that has
		 * to survive being offline, so the coloured letter stays as the fallback and comes back
		 * if the image fails to load.
		 */
		const img = el('img');
		img.src = photo;
		img.alt = '';
		img.referrerPolicy = 'no-referrer';
		img.onerror = () => {
			chip.classList.remove('has-photo');
			chip.textContent = avatarLetter(name, mail);
			chip.style.background = avatarFor(name || mail || 'workspace');
		};
		chip.classList.add('has-photo');
		chip.appendChild(img);
	} else {
		chip.style.background = avatarFor(name || mail || 'workspace');
	}
	foot.appendChild(chip);
}

function showPage(id) {
	state.page = id;
	const page = PAGES.find((p) => p.id === id) || PAGES[0];
	$('#pageTitle').textContent = page.label;
	for (const node of document.querySelectorAll('.page')) node.classList.remove('active');
	$('#page-' + id).classList.add('active');
	renderRail();

	if (id === 'chats') renderInbox();
	if (id === 'emails') renderEmails();
	if (id === 'social') renderSocial();
	if (id === 'settings') renderSettings();
	if (id === 'help') renderHelp();
}

// ==========================================================================
// Chats page
// ==========================================================================
const FILTERS = ['All', 'Pending', 'Assigned', 'Unassigned', 'Closed'];

function matchesFilter(convo) {
	switch (state.filter) {
		case 'Pending': return convo.status === 'pending';
		case 'Assigned': return !!convo.assignedAgentUid && convo.status !== 'closed';
		case 'Unassigned': return !convo.assignedAgentUid && convo.status !== 'closed';
		case 'Closed': return convo.status === 'closed';
		default: return true;
	}
}

function renderChips() {
	const host = $('#chips');
	host.innerHTML = '';
	for (const f of FILTERS) {
		const btn = el('button', 'chip-btn' + (state.filter === f ? ' on' : ''), f);
		btn.onclick = () => {
			state.filter = f;
			renderInbox();
		};
		host.appendChild(btn);
	}
}

function renderInbox() {
	renderChips();
	const host = $('#convList');
	host.innerHTML = '';
	const needle = state.search.trim().toLowerCase();
	const rows = state.conversations.filter((c) => {
		if (!matchesFilter(c)) return false;
		if (!needle) return true;
		return (c.name + ' ' + c.email + ' ' + c.lastText).toLowerCase().includes(needle);
	});

	if (rows.length === 0) {
		host.appendChild(emptyState('chat', 'Nothing here', 'No conversations match this filter.'));
		return;
	}

	for (const convo of rows) {
		const btn = el('button', 'conv' + (state.openId === convo.id ? ' on' : ''));
		btn.appendChild(avatarNode('conv-av', convo));

		const body = el('span', 'conv-body');
		const line1 = el('span', 'conv-line1');
		line1.appendChild(el('b', null, convo.name));
		line1.appendChild(el('span', 'conv-time', timeLabel(convo.lastAt)));
		body.appendChild(line1);

		const line2 = el('span', 'conv-line2');
		const prefix = convo.lastSender === 'agent' ? 'You: ' : '';
		line2.appendChild(el('span', 'conv-prev', prefix + (convo.lastText || 'No messages yet')));
		if (convo.status === 'pending') line2.appendChild(el('span', 'tag pending', 'Pending'));
		else if (convo.status === 'closed') line2.appendChild(el('span', 'tag closed', 'Closed'));
		if (convo.unread > 0) line2.appendChild(el('span', 'unread', String(convo.unread)));
		body.appendChild(line2);

		btn.appendChild(body);
		btn.onclick = () => openConversation(convo.id);
		host.appendChild(btn);
	}
}

function openConversation(id) {
	state.openId = id;
	$('#page-chats').classList.add('viewing');
	renderInbox();
	renderThread();
	watchMessages(id);
}

function currentConvo() {
	return state.conversations.find((c) => c.id === state.openId) || null;
}

function renderThread() {
	const convo = currentConvo();
	const head = $('#threadHead');
	const msgs = $('#msgs');
	const foot = $('#threadFoot');

	if (!convo) {
		head.innerHTML = '';
		foot.innerHTML = '';
		msgs.innerHTML = '';
		msgs.appendChild(emptyState('chat', 'Pick a conversation', 'Choose a thread on the left to read it here.'));
		return;
	}

	// -------- header
	head.innerHTML = '';
	const back = el('button', 'icon-btn');
	back.innerHTML = ICONS.back;
	back.onclick = () => {
		state.openId = null;
		$('#page-chats').classList.remove('viewing');
		if (state.unsubMsgs) state.unsubMsgs();
		renderInbox();
		renderThread();
	};
	head.appendChild(back);

	const who = el('button', 'thread-who');
	who.appendChild(avatarNode('conv-av', convo));
	const text = el('span');
	text.appendChild(el('b', null, convo.name));
	text.appendChild(el('span', null, convo.email || convo.pageUrl || 'Website visitor'));
	who.appendChild(text);
	who.onclick = () => showProfile(convo);
	head.appendChild(who);

	/*
	 * Both directions. Closing was already here; reopening was not, so a thread closed by
	 * mistake could only be brought back from the phone. setStatusOf already accepted 'open'.
	 */
	if (convo.status === 'closed') {
		const reopen = el('button', 'icon-btn');
		reopen.innerHTML = ICONS.reopenTicket;
		reopen.title = 'Reopen conversation';
		reopen.onclick = () => setStatusOf(convo.id, 'open');
		head.appendChild(reopen);
	} else {
		const close = el('button', 'icon-btn');
		close.innerHTML = ICONS.closeTicket;
		close.title = 'Close conversation';
		close.onclick = () => setStatusOf(convo.id, 'closed');
		head.appendChild(close);
	}

	// -------- messages
	const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 90;
	msgs.innerHTML = '';
	let lastDay = '';
	for (const m of state.messages) {
		const day = dayLabel(m.createdAt);
		if (day !== lastDay) {
			msgs.appendChild(el('div', 'daystamp', day));
			lastDay = day;
		}
		if (m.sender === 'system') {
			msgs.appendChild(el('div', 'sysline', m.text));
			continue;
		}
		const out = m.sender === 'agent';
		const wrap = el('div', 'msg-wrap' + (out ? ' out' : ''));
		if (!out) wrap.appendChild(msgAvatar(m, convo));
		const bubble = el('div', 'bubble');
		// No read receipts. The app does not draw them in a bubble, so neither does this.
		const meta = el('span', 'meta', new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
		// Text first, timestamp second. The old order relied on a float and short messages wrapped
		// themselves around it.
		bubble.appendChild(el('span', 'txt', m.text));
		bubble.appendChild(meta);
		wrap.appendChild(bubble);
		msgs.appendChild(wrap);
	}
	if (state.messages.length === 0) {
		msgs.appendChild(emptyState('chat', 'No messages yet', 'Nothing has been said in this thread.'));
	}
	if (atBottom) requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });

	// -------- composer
	foot.innerHTML = '';
	if (convo.status === 'pending') {
		const bar = el('div', 'startbar');
		const btn = el('button', 'btn', 'Start chat');
		btn.onclick = () => setStatusOf(convo.id, 'open');
		bar.appendChild(btn);
		foot.appendChild(bar);
		return;
	}
	if (convo.status === 'closed') {
		const bar = el('div', 'startbar');
		bar.appendChild(el('span', 'conn-pill', 'This conversation is closed'));
		foot.appendChild(bar);
		return;
	}

	const composer = el('div', 'composer');
	const box = el('textarea');
	box.rows = 1;
	box.placeholder = 'Message';
	const send = el('button', 'send-btn');
	send.innerHTML = ICONS.send;
	send.disabled = true;

	const autoGrow = () => {
		box.style.height = 'auto';
		box.style.height = Math.min(box.scrollHeight, 132) + 'px';
		send.disabled = box.value.trim().length === 0;
	};
	const fire = () => {
		const body = box.value;
		if (!body.trim()) return;
		// Clear FIRST. Waiting for the write to land is what made the app feel laggy.
		box.value = '';
		autoGrow();
		sendMessage(body);
	};
	box.oninput = autoGrow;
	box.onkeydown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			fire();
		}
	};
	send.onclick = fire;
	composer.appendChild(box);
	composer.appendChild(send);
	foot.appendChild(composer);
}

/**
 * The disc beside an incoming message in the thread.
 *
 * From the reference screenshots: the visitor's own picture on their messages, and a flat accent
 * disc with a chat glyph on automated ones. Outgoing agent messages get nothing, because the
 * person reading this screen does not need to be told which messages are theirs.
 */
function msgAvatar(message, convo) {
	if (message.kind === 'bot') {
		const bot = el('span', 'msg-av bot');
		bot.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.4c-4.3 0-7.8 ' +
			'2.9-7.8 6.5 0 2 1.1 3.8 2.8 5l-.8 3.1a.5.5 0 0 0 .74.55l3.2-1.8c.6.1 1.2.15 1.86.15 ' +
			'4.3 0 7.8-2.9 7.8-6.5S16.3 4.4 12 4.4Z"/></svg>';
		return bot;
	}
	return avatarNode('msg-av', convo);
}

function showProfile(convo) {
	const rows = [
		['Name', convo.name],
		['Email', convo.email || 'Not provided'],
		['Status', convo.status],
		['First seen', convo.createdAt ? new Date(convo.createdAt).toLocaleString() : 'Unknown'],
		['Last activity', convo.lastAt ? new Date(convo.lastAt).toLocaleString() : 'Unknown'],
		['Page', convo.pageUrl || 'Unknown'],
	];
	const body = rows
		.map(([k, v]) => `<div class="row"><div class="row-main"><b>${escapeHtml(k)}</b></div><div class="row-val">${escapeHtml(v)}</div></div>`)
		.join('');
	openSheet(convo.name, `<div class="card">${body}</div>`);
}

// ==========================================================================
// A very small modal, used by the profile view and confirmations
// ==========================================================================
function openSheet(title, html) {
	const scrim = el('div', 'scrim open');
	scrim.style.zIndex = '70';
	const panel = el('div', 'card');
	panel.style.cssText =
		'position:fixed;z-index:71;top:50%;left:50%;transform:translate(-50%,-50%);width:min(520px,92vw);max-height:82vh;overflow:auto;';
	panel.innerHTML = `<div class="card-title" style="padding:20px 20px 10px">${escapeHtml(title)}</div>${html}<div style="padding:16px 20px 20px;text-align:right"><button class="btn ghost sm" id="sheetClose">Close</button></div>`;
	document.body.appendChild(scrim);
	document.body.appendChild(panel);
	const shut = () => {
		scrim.remove();
		panel.remove();
	};
	scrim.onclick = shut;
	panel.querySelector('#sheetClose').onclick = shut;
	return shut;
}

function emptyState(icon, title, message) {
	const node = el('div', 'empty');
	const chip = el('div', 'chip');
	chip.innerHTML = ICONS[icon] || ICONS.chat;
	node.appendChild(chip);
	node.appendChild(el('b', null, title));
	node.appendChild(el('span', null, message));
	return node;
}

function gate(feature, label) {
	const features = ownedFeatures();
	if (features.has('*') || features.has(feature)) return null;
	const node = el('div', 'wrap');
	const card = el('div', 'card');
	card.appendChild(emptyState('card', label + ' is not in your plan', 'Upgrade to unlock this section. Your current plan does not include it.'));
	const foot = el('div', 'note');
	// Plans are bought in the app. This browser never had a working subscription page - the
	// function that drew one wrote into a section index.html does not contain - so it says so
	// rather than navigating into nothing.
	const btn = el('button', 'btn sm', 'How to upgrade');
	btn.onclick = () => toast('Open Support Chat on your phone, then Settings \u2192 Subscription.');
	foot.appendChild(btn);
	card.appendChild(foot);
	node.appendChild(card);
	return node;
}

// ==========================================================================
// Remaining pages
// ==========================================================================
async function renderEmails() {
	const host = $('#page-emails');
	const blocked = gate(FEATURE_EMAIL, 'Emails');
	if (blocked) {
		host.innerHTML = '';
		host.appendChild(blocked);
		return;
	}
	host.innerHTML = '<div class="wrap"><div class="card"><div class="card-title">Captured emails</div><div id="leadRows"></div></div></div>';
	await loadLeads();
	const rows = $('#leadRows');
	rows.innerHTML = '';
	if (state.leads.length === 0) {
		rows.appendChild(emptyState('mail', 'No emails yet', 'Addresses visitors enter in the widget appear here.'));
		return;
	}
	for (const lead of state.leads) {
		const row = el('div', 'row');
		const tile = el('span', 'row-tile');
		tile.style.background = '#0E8F86';
		tile.innerHTML = ICONS.mail;
		row.appendChild(tile);
		const main = el('div', 'row-main');
		main.appendChild(el('b', null, lead.email));
		main.appendChild(el('span', null,
			`${lead.conversationCount || 0} conversation(s)` +
			(lead.emailVerified ? ' · verified' : '')));
		row.appendChild(main);
		row.appendChild(el('div', 'row-val', lead.source || 'manual'));
		rows.appendChild(row);
	}
}

async function loadLeads() {
	try {
		const snap = await getDocs(collection(fs, 'tenants', state.tenantId, 'leads'));
		state.leads = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
	} catch (err) {
		state.leads = [];
	}
}

function renderSocial() {
	const host = $('#page-social');
	const blocked = gate(FEATURE_SOCIAL, 'Social media');
	host.innerHTML = '';
	if (blocked) {
		host.appendChild(blocked);
		return;
	}
	const wrap = el('div', 'wrap');
	const card = el('div', 'card');
	card.appendChild(emptyState('social', 'Social inboxes', 'Channel connections are managed in the app. Nothing is connected yet.'));
	wrap.appendChild(card);
	host.appendChild(wrap);
}


/*
 * Settings, rebuilt to the app's Settings screen.
 *
 * The browser used to show two toggles and a note. The phone shows eleven rows in four named
 * sections, each with its own coloured tile, and the two screens did not look related.
 *
 * The sections, the order, the wording and the tile colours below are taken from
 * SettingsScreen.kt. Rows that cannot act in a browser are still drawn, because leaving them out
 * is what made this screen look like a different product - but they are marked `app` and say so
 * when pressed, rather than pretending to work. Nothing has been added that the app does not
 * have: no App icon row, no Emails row.
 */
const SETTING_TINTS = {
	blue: '#1677FF', teal: '#00A89D', green: '#16A34A', orange: '#F97316',
	red: '#EF4444', indigo: '#6366F1', purple: '#8B5CF6', pink: '#EC4899',
	bronze: '#E0A126', plum: '#7C3AED',
};

function settingsRow(icon, tint, title, sub, control) {
	return `<div class="row${control === 'app' ? ' app-only' : ''}" data-row="${title}">` +
		`<span class="row-tile" style="background:${tint}">${icon}</span>` +
		`<div class="row-main"><b>${escapeHtml(title)}</b><span>${escapeHtml(sub)}</span></div>` +
		(control && control !== 'app' ? control : '') +
		'</div>';
}

function renderSettings() {
	const dark = document.documentElement.dataset.theme === 'dark';
	const tenant = state.tenant || {};
	const email = tenant.email || 'Signed in on this browser';
	const site = (state.website && (state.website.domain || state.website.url)) || 'No website linked yet';
	const plan = tenant.planName || tenant.plan || 'Free';
	const T = SETTING_TINTS;

	const html = '<div class="wrap">' +

		'<div class="card"><div class="card-title">Account</div>' +
		settingsRow(ICONS.person, T.blue, email, 'Signed in', 'app') +
		settingsRow(ICONS.globe, T.teal, 'Link your website', site, 'app') +
		// A monitor, not the website globe. "Link your website" sits directly above and the two
		// rows carrying the same picture made them read as one setting.
		settingsRow(ICONS.monitor, T.purple, 'Link a computer', 'This browser is paired', 'app') +
		settingsRow(ICONS.social, T.pink, 'Link social media accounts',
			'Connect Instagram, Facebook and WhatsApp.', 'app') +
		settingsRow(ICONS.card, T.indigo, 'Subscription', plan + ' plan', 'app') +
		'</div>' +

		/*
		 * Connected devices. The list is filled in by paintDeviceList once RTDB answers rather
		 * than rendered inline, because settings is drawn synchronously on every tab switch and
		 * blocking it on a network read would stall the whole page.
		 */
		'<div class="card"><div class="card-title">Connected devices</div>' +
		'<div id="deviceList"><div class="row"><div class="row-main"><b>Looking for paired ' +
		'browsers…</b><span>This takes a moment.</span></div></div></div>' +
		'</div>' +

		'<div class="card"><div class="card-title">Notifications</div>' +
		settingsRow(ICONS.broadcast, T.green, 'Stay connected', 'Keeps this browser listening for new chats.',
			'<button class="switch on" id="stayToggle"></button>') +
		settingsRow(ICONS.bell, T.orange, 'Allow instant notifications',
			Notification.permission === 'granted' ? 'Allowed for this browser' : 'Not allowed yet',
			`<button class="switch${Notification.permission === 'granted' ? ' on' : ''}" id="notifToggle"></button>`) +
		settingsRow(ICONS.power, T.red, 'Autostart', 'Set on your phone.', 'app') +
		'</div>' +

		'<div class="card"><div class="card-title">Appearance</div>' +
		settingsRow(ICONS.moon, T.indigo, 'Dark mode', 'Follows this browser only.',
			`<button class="switch${dark ? ' on' : ''}" id="darkToggle"></button>`) +
		settingsRow(ICONS.image, T.pink, 'Chat wallpaper', 'Set on your phone.', 'app') +
		'</div>' +

		'<div class="card"><div class="card-title">Other</div>' +
		settingsRow(ICONS.database, T.plum, 'Storage and data', 'Log this browser out or clear its cache.',
			'<button class="btn ghost sm" id="storageBtn">Manage</button>') +
		settingsRow(ICONS.help, T.bronze, 'Help and contact', 'Reach the team.',
			'<button class="btn ghost sm" id="helpBtn">Open</button>') +
		'</div>' +

		/*
		 * Log out gets its own card at the end rather than a row inside Other.
		 *
		 * It was previously only reachable by opening Storage and data and reading to the
		 * bottom of a sheet, which is three steps and a wrong-looking place for it. Signing out
		 * is a destination in its own right, so it sits alone, last, in the danger colour, where
		 * a destructive action is expected to be and where it cannot be hit by accident on the
		 * way to something else.
		 */
		'<div class="card">' +
		settingsRow(ICONS.logout, T.red, 'Log out', 'Unpairs this browser. Your phone stays signed in.',
			'<button class="btn danger sm" id="logoutBtn">Log out</button>') +
		'</div>' +

		'<div class="note">Support Chat Web 1.0.3</div></div>';

	$('#page-settings').innerHTML = html;
	paintDeviceList();

	// Rows the phone owns say so once, rather than looking broken.
	for (const row of document.querySelectorAll('#page-settings .row.app-only')) {
		row.onclick = () => toast('Change this in Support Chat on your phone.');
	}

	$('#darkToggle').onclick = (e) => {
		const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
		applyTheme(next);
		e.currentTarget.classList.toggle('on', next === 'dark');
	};

	$('#stayToggle').onclick = () => toast('This browser stays connected while the tab is open.');

	$('#notifToggle').onclick = async (e) => {
		if (Notification.permission === 'granted') {
			toast('Turn notifications off in your browser\u2019s site settings.');
			return;
		}
		const result = await Notification.requestPermission();
		e.currentTarget.classList.toggle('on', result === 'granted');
	};

	/*
	 * Storage and data is a dialog rather than a page. The app has a whole screen for it, but the
	 * only two things it can do in a browser are these, and a page holding two rows next to five
	 * that say "set on your phone" was not worth a nav entry.
	 */
	$('#storageBtn').onclick = () => {
		const shut = openSheet('Storage and data',
			'<div class="card">' +
			'<div class="row"><div class="row-main"><b>Clear local cache</b>' +
			'<span>Removes the saved pairing from this browser only.</span></div>' +
			'<button class="btn ghost sm" id="clearLocal">Clear</button></div>' +
			'<div class="row"><div class="row-main"><b>Log out of this browser</b>' +
			'<span>Revokes the grant so this browser has to scan a new QR.</span></div>' +
			'<button class="btn danger sm" id="revoke">Log out</button></div></div>');
		$('#clearLocal').onclick = () => {
			storeSession(null);
			shut();
			toast('Local cache cleared. Reload to pair again.');
		};
		$('#revoke').onclick = () => {
			/*
			 * Was storeSession(null) + reload, which only forgot the pairing locally. The
			 * grant at chats/{tenant}/sessions/{uid} survived, so the phone's Linked devices
			 * list kept showing a browser that had already logged out, and the rules kept
			 * honouring it. revokeDevice deletes the grant first and reloads afterwards.
			 */
			revokeDevice(state.uid);
		};
	};

	$('#helpBtn').onclick = () => showPage('help');

	$('#logoutBtn').onclick = () => {
		const shut = openSheet('Log out of this browser',
			'<div class="card"><div class="note">This revokes the pairing grant. The console will go ' +
			'back to the QR screen and you will need to scan again from the app to return. Nothing ' +
			'is deleted and your phone is not signed out.</div>' +
			'<div class="row"><div class="row-main"><b>Log out</b>' +
			'<span>Ends the session on this computer only.</span></div>' +
			'<button class="btn danger sm" id="logoutGo">Log out</button></div></div>');
		$('#logoutGo').onclick = () => {
			// Delete the grant, not just the local copy of it. See revokeDevice.
			shut();
			revokeDevice(state.uid);
		};
	};
}

function renderHelp() {
	$('#page-help').innerHTML =
		'<div class="wrap"><div class="card"><div class="card-title">Help and contact</div>' +
		`<div class="row"><span class="row-tile" style="background:#0E8F86">${ICONS.mail}</span>` +
		'<div class="row-main"><b>info@keykraftt.com</b><span>Support inbox</span></div></div>' +
		`<div class="row"><span class="row-tile" style="background:#1D6FE0">${ICONS.globe}</span>` +
		'<div class="row-main"><b>keykraftt.com</b><span>Website</span></div></div>' +
		'<div class="note">This browser is paired to your workspace. To sign it out, open Settings and ' +
		'choose Storage and data, or remove the session from the app.</div></div></div>';
}

// ==========================================================================
// Desktop notifications for newly pending threads
// ==========================================================================
let knownPending = null;
function notifyPending() {
	const pending = new Set(state.conversations.filter((c) => c.status === 'pending').map((c) => c.id));
	if (knownPending === null) {
		knownPending = pending;
		return;
	}
	for (const id of pending) {
		if (!knownPending.has(id) && Notification.permission === 'granted') {
			const convo = state.conversations.find((c) => c.id === id);
			new Notification('Someone wants to talk to support', {
				body: (convo && convo.lastText) || 'A visitor is waiting.',
			});
		}
	}
	knownPending = pending;
}

// ==========================================================================
// Resizable conversation list
// ==========================================================================
/*
 * The list was pinned at 372px. On a wide screen that wastes the thread's space, and on a
 * laptop it crowds it.
 *
 * The clamp is enforced here as well as in the CSS max-width, because the stored value has to be
 * clamped too: a width saved on a 2560px monitor must not open off-screen on a 1280px laptop.
 */
const INBOX_MIN = 280;
const INBOX_MAX = 520;
const INBOX_KEY = 'supportchat.inboxWidth';

function setInboxWidth(px) {
	const clamped = Math.max(INBOX_MIN, Math.min(INBOX_MAX, Math.round(px)));
	document.documentElement.style.setProperty('--inbox-w', clamped + 'px');
	return clamped;
}

function initInboxResizer() {
	const saved = parseInt(localStorage.getItem(INBOX_KEY) || '', 10);
	if (!Number.isNaN(saved)) setInboxWidth(saved);

	const handle = $('#inboxResizer');
	const inbox = document.querySelector('.inbox');
	if (!handle || !inbox) return;

	let dragging = false;

	const move = (e) => {
		if (!dragging) return;
		e.preventDefault();
		const point = e.touches ? e.touches[0].clientX : e.clientX;
		setInboxWidth(point - inbox.getBoundingClientRect().left);
	};

	const stop = () => {
		if (!dragging) return;
		dragging = false;
		handle.classList.remove('dragging');
		document.body.classList.remove('resizing');
		const current = parseInt(getComputedStyle(inbox).width, 10);
		if (!Number.isNaN(current)) localStorage.setItem(INBOX_KEY, String(current));
	};

	const start = (e) => {
		dragging = true;
		handle.classList.add('dragging');
		document.body.classList.add('resizing');
		move(e);
	};

	handle.addEventListener('mousedown', start);
	handle.addEventListener('touchstart', start, { passive: false });
	window.addEventListener('mousemove', move);
	window.addEventListener('touchmove', move, { passive: false });
	window.addEventListener('mouseup', stop);
	window.addEventListener('touchend', stop);

	// Double click puts it back, so a bad drag is one gesture to undo rather than a careful one.
	handle.addEventListener('dblclick', () => {
		localStorage.setItem(INBOX_KEY, String(setInboxWidth(372)));
	});
}

// ==========================================================================
// Boot
// ==========================================================================
async function boot() {
	applyTheme();
	initInboxResizer();

	$('#searchBox').oninput = (e) => {
		state.search = e.target.value;
		renderInbox();
	};

	try {
		app = initializeApp(FIREBASE_CONFIG);
		auth = getAuth(app);
		db = getDatabase(app);
		fs = getFirestore(app);
	} catch (err) {
		setStatus('Could not reach Firebase. Check the config in console.js.', 'err');
		return;
	}

	onAuthStateChanged(auth, async (user) => {
		if (!user) return;
		state.uid = user.uid;
		const resumed = await resumeSession();
		if (!resumed) {
			/*
			 * A remembered tenant whose grant no longer works still tells us which workspace
			 * this computer belongs to, which is enough to offer the devices list on the login
			 * screen. If the read is denied, watchDevices leaves the section hidden.
			 */
			const saved = stored();
			if (saved && saved.tenantId) watchDevices(saved.tenantId, { pairing: true });
			try {
				await beginPairing();
			} catch (err) {
				setStatus(
					'Could not start a pairing session. Make sure Anonymous sign-in is enabled in Firebase Auth.',
					'err',
				);
			}
		}
	});

	try {
		await signInAnonymously(auth);
	} catch (err) {
		setStatus(
			'Anonymous sign-in is turned off for this Firebase project. Enable it under Authentication → Sign-in method.',
			'err',
		);
	}

	// Redraw relative timestamps and fire notifications on a slow tick.
	setInterval(() => {
		notifyPending();
		if (state.page === 'chats' && !state.openId) renderInbox();
	}, 30000);
}

boot();
