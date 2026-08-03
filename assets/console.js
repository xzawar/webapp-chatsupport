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

/*
 * Write a text node only when the text is actually different.
 *
 * Assigning textContent tears down the existing text node and makes a new one even when the
 * string is identical, which loses any selection inside it and dirties the node for no reason.
 * Every incremental painter below goes through this.
 */
const setText = (node, text) => {
	const next = text == null ? '' : String(text);
	if (node.textContent !== next) node.textContent = next;
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
			// The open thread has to be redrawn as well. Without this, a lock applied from the
			// phone or a second browser left this thread's header and composer stale until a
			// message arrived and watchMessages() happened to redraw it.
			if (state.openId) renderThread();
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
	/*
	 * Paint first, write second.
	 *
	 * This is the "it only locks after I send a message" bug. Locking used to do nothing but
	 * the write below, and the conversations listener that answers that write calls
	 * renderInbox() and renderRail() - never renderThread(). So the open thread kept its old
	 * header and its old composer until something else forced a thread redraw, and the only
	 * thing that did that was watchMessages() firing when a message went out.
	 *
	 * The local row is updated here and the thread is redrawn straight away. The listener
	 * still confirms it a moment later with the server's copy; if the write fails, the catch
	 * below puts the old status back.
	 */
	const row = state.conversations.find((c) => c.id === conversationId);
	const previous = row ? row.status : null;
	if (row) {
		row.status = status;
		renderInbox();
		if (state.openId === conversationId) renderThread();
	}
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
		if (row && previous) {
			row.status = previous;
			renderInbox();
			if (state.openId === conversationId) renderThread();
		}
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

/*
 * The rail, patched in place instead of rebuilt.
 *
 * renderRail() used to start with `top.innerHTML = ''; foot.innerHTML = ''` and build five
 * buttons, an SVG each, from scratch. watchConversations() calls it on every RTDB snapshot, so a
 * single incoming message threw away the rail and made a new one: the icons blinked, the badge
 * restarted, and any :hover or :focus the pointer was sitting on was lost because the node under
 * the cursor no longer existed.
 *
 * The buttons are built once and then only the two things that actually change - the active
 * class and the badge number - are written. The identity chip is repainted only when the tenant
 * name, email or photo really differ, since it holds an <img> that would otherwise refetch.
 */
let railNodes = null;
let railChipKey = '';

function paintRailBadge(btn, count) {
	let badge = btn.querySelector('.rail-badge');
	if (count > 0) {
		if (!badge) {
			badge = el('span', 'rail-badge');
			btn.appendChild(badge);
		}
		setText(badge, String(count));
	} else if (badge) {
		badge.remove();
	}
}

function buildRail(top, foot) {
	top.innerHTML = '';
	foot.innerHTML = '';
	railNodes = { buttons: new Map(), chip: null };
	railChipKey = '';

	const button = (page) => {
		const btn = el('button', 'rail-btn');
		btn.type = 'button';
		// Icons only, so the label has to survive as the accessible name and as the tooltip.
		// Without both, an icon rail is a row of unlabelled squares to a screen reader and a
		// guessing game to everyone else on their first visit.
		btn.title = page.label;
		btn.setAttribute('aria-label', page.label);
		btn.innerHTML = ICONS[page.icon] || ICONS.chat;
		btn.onclick = () => showPage(page.id);
		railNodes.buttons.set(page.id, btn);
		return btn;
	};

	for (const page of PAGES) {
		if (page.rail) top.appendChild(button(page));
	}
	foot.appendChild(button(PAGES.find((p) => p.id === 'settings')));

	// The workspace avatar is pinned to the bottom, under the settings button, the way the
	// reference does it. It is an identity marker rather than a control, so it is not a button.
	railNodes.chip = el('span', 'rail-me');
	foot.appendChild(railNodes.chip);
}

function paintRailChip(chip) {
	const name = (state.tenant && (state.tenant.companyName || state.tenant.ownerName)) || '';
	const mail = (state.tenant && state.tenant.email) || '';
	const photo = ownerPhotoSrc(state.tenant);
	const key = name + '\u0001' + mail + '\u0001' + (photo || '');
	if (key === railChipKey) return;
	railChipKey = key;

	chip.innerHTML = '';
	chip.classList.remove('has-photo');
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
		chip.textContent = avatarLetter(name, mail);
		chip.style.background = avatarFor(name || mail || 'workspace');
	}
}

function renderRail() {
	const top = $('#railTop');
	const foot = $('#railFoot');
	if (!top || !foot) return;
	if (!railNodes || !top.firstChild) buildRail(top, foot);

	const pending = state.conversations.filter((c) => c.status === 'pending').length;
	const unread = state.conversations.reduce((sum, c) => sum + (c.unread > 0 ? 1 : 0), 0);

	for (const [id, btn] of railNodes.buttons) {
		btn.classList.toggle('active', state.page === id);
		paintRailBadge(btn, id === 'chats' ? unread + pending : 0);
	}
	paintRailChip(railNodes.chip);
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

/*
 * The filter chips are five static buttons whose only changing property is which one carries
 * `.on`. Rebuilding them on every inbox paint - which is every RTDB snapshot - meant five
 * elements were destroyed and recreated to move one class.
 */
let chipNodes = null;

function renderChips() {
	const host = $('#chips');
	if (!host) return;
	if (!chipNodes || !host.firstChild) {
		host.innerHTML = '';
		chipNodes = new Map();
		for (const f of FILTERS) {
			const btn = el('button', 'chip-btn', f);
			btn.onclick = () => {
				if (state.filter === f) return;
				state.filter = f;
				renderInbox();
			};
			host.appendChild(btn);
			chipNodes.set(f, btn);
		}
	}
	for (const [f, btn] of chipNodes) btn.classList.toggle('on', state.filter === f);
}

/*
 * The inbox, reconciled by conversation id rather than rebuilt.
 *
 * The old renderInbox() opened with `host.innerHTML = ''` and then made a fresh button, avatar
 * disc and four spans for every conversation. watchConversations() fires that on every write to
 * the conversations node - a visitor typing sends a lastMessage update per message - so the
 * entire list was destroyed and rebuilt several times a minute. That is what the flashing was:
 * not a repaint of changed text, but a list of new elements fading in from scratch, with the
 * scroll position, the hover state and the keyboard focus going with them.
 *
 * Now each conversation keeps its DOM node for as long as it is on screen. A snapshot writes
 * only the fields that differ, moves nodes that changed position, and removes the ones that left
 * the filter. A message arriving in a thread you are not looking at now touches two text nodes
 * and a badge.
 */
let convNodes = new Map();
let inboxEmptyNode = null;

function buildConvNode(convo) {
	const root = el('button', 'conv');
	const body = el('span', 'conv-body');
	const line1 = el('span', 'conv-line1');
	const name = el('b');
	const time = el('span', 'conv-time');
	const line2 = el('span', 'conv-line2');
	const prev = el('span', 'conv-prev');

	line1.appendChild(name);
	line1.appendChild(time);
	line2.appendChild(prev);
	body.appendChild(line1);
	body.appendChild(line2);

	const av = avatarNode('conv-av', convo);
	root.appendChild(av);
	root.appendChild(body);
	root.onclick = () => openConversation(convo.id);

	return { root, av, avKey: '', name, time, prev, line2, tag: null, unread: null };
}

function paintConvNode(entry, convo) {
	// The disc is the one expensive child - it can hold an <img> - so it is only replaced when
	// the values it is drawn from actually change.
	const avKey = convo.id + '\u0001' + convo.name + '\u0001' + convo.email + '\u0001' + (convo.photoUrl || '');
	if (entry.avKey !== avKey) {
		entry.avKey = avKey;
		const fresh = avatarNode('conv-av', convo);
		entry.root.replaceChild(fresh, entry.av);
		entry.av = fresh;
	}

	setText(entry.name, convo.name);
	setText(entry.time, timeLabel(convo.lastAt));
	setText(entry.prev, (convo.lastSender === 'agent' ? 'You: ' : '') + (convo.lastText || 'No messages yet'));
	entry.root.classList.toggle('on', state.openId === convo.id);

	const tagText = convo.status === 'pending' ? 'Pending' : convo.status === 'closed' ? 'Closed' : '';
	if (!tagText) {
		if (entry.tag) {
			entry.tag.remove();
			entry.tag = null;
		}
	} else {
		if (!entry.tag) {
			entry.tag = el('span', 'tag');
			// Kept ahead of the unread badge whichever order they appeared in.
			entry.line2.insertBefore(entry.tag, entry.unread || null);
		}
		const cls = 'tag ' + (convo.status === 'pending' ? 'pending' : 'closed');
		if (entry.tag.className !== cls) entry.tag.className = cls;
		setText(entry.tag, tagText);
	}

	if (convo.unread > 0) {
		if (!entry.unread) {
			entry.unread = el('span', 'unread');
			entry.line2.appendChild(entry.unread);
		}
		setText(entry.unread, String(convo.unread));
	} else if (entry.unread) {
		entry.unread.remove();
		entry.unread = null;
	}
}

function renderInbox() {
	renderChips();
	const host = $('#convList');
	if (!host) return;
	const needle = state.search.trim().toLowerCase();
	const rows = state.conversations.filter((c) => {
		if (!matchesFilter(c)) return false;
		if (!needle) return true;
		return (c.name + ' ' + c.email + ' ' + c.lastText).toLowerCase().includes(needle);
	});

	if (rows.length === 0) {
		if (!inboxEmptyNode) {
			host.innerHTML = '';
			convNodes.clear();
			inboxEmptyNode = emptyState('chat', 'Nothing here', 'No conversations match this filter.');
			host.appendChild(inboxEmptyNode);
		}
		return;
	}
	if (inboxEmptyNode) {
		inboxEmptyNode.remove();
		inboxEmptyNode = null;
	}

	/*
	 * Walk the wanted order and the live children together. A node already in the right place
	 * is left alone entirely; only genuinely moved rows are re-inserted, so the common case of
	 * "the top conversation got a new message and everything else stayed put" touches nothing.
	 */
	let cursor = host.firstChild;
	const seen = new Set();
	for (const convo of rows) {
		seen.add(convo.id);
		let entry = convNodes.get(convo.id);
		if (!entry) {
			entry = buildConvNode(convo);
			convNodes.set(convo.id, entry);
		}
		paintConvNode(entry, convo);
		if (entry.root !== cursor) host.insertBefore(entry.root, cursor);
		else cursor = cursor.nextSibling;
	}
	for (const [id, entry] of convNodes) {
		if (seen.has(id)) continue;
		entry.root.remove();
		convNodes.delete(id);
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

/*
 * The thread, reconciled by message id rather than rebuilt.
 *
 * The old renderThread() emptied #threadHead, #msgs and #threadFoot and rebuilt all three from
 * scratch. It was called from watchMessages() on every snapshot and from watchConversations() on
 * every conversation write, which is the whole of the reported problem:
 *
 *   - every bubble in the thread was destroyed and remade, so every bubble replayed the
 *     bubble-rise animation and the entire transcript flashed each time one message arrived
 *   - the composer was replaced, so a half-typed reply, the caret position, the grown textarea
 *     height and the keyboard focus were all thrown away mid-sentence
 *   - the header's SVGs were reparsed to move one class
 *
 * Now the header is built once per conversation and only its text and lock icon are updated;
 * messages are keyed and only the arriving one is inserted; the composer is left completely
 * untouched unless the conversation's status actually changes what it should be. The one full
 * teardown that remains is switching conversations, where every element genuinely is different.
 */
let threadState = { convoId: null, head: null, lockKey: '', composerMode: '', painted: false };
let msgNodes = new Map();

function clockLabel(ms) {
	return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderThread() {
	const convo = currentConvo();
	const head = $('#threadHead');
	const msgs = $('#msgs');
	const foot = $('#threadFoot');
	if (!head || !msgs || !foot) return;

	if (!convo) {
		if (threadState.convoId !== null || !msgs.firstChild) {
			head.innerHTML = '';
			foot.innerHTML = '';
			msgs.innerHTML = '';
			msgNodes.clear();
			msgs.appendChild(emptyState('chat', 'Pick a conversation', 'Choose a thread on the left to read it here.'));
			threadState = { convoId: null, head: null, lockKey: '', composerMode: '', painted: false };
		}
		return;
	}

	if (threadState.convoId !== convo.id) {
		head.innerHTML = '';
		msgs.innerHTML = '';
		foot.innerHTML = '';
		msgNodes.clear();
		threadState = { convoId: convo.id, head: null, lockKey: '', composerMode: '', painted: false };
	}

	renderThreadHead(head, convo);
	renderMessages(msgs, convo);
	renderComposer(foot, convo);
}

function renderThreadHead(head, convo) {
	if (!threadState.head || !head.firstChild) {
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
		const av = avatarNode('conv-av', convo);
		const text = el('span');
		const name = el('b');
		const sub = el('span');
		text.appendChild(name);
		text.appendChild(sub);
		who.appendChild(av);
		who.appendChild(text);
		// Reads the conversation at click time, not at build time, so a profile opened after a
		// status or email change shows the current values.
		who.onclick = () => showProfile(currentConvo() || convo);
		head.appendChild(who);

		/*
		 * Both directions. Closing was already here; reopening was not, so a thread closed by
		 * mistake could only be brought back from the phone. setStatusOf already accepted 'open'.
		 */
		const bolt = el('button', 'icon-btn');
		bolt.onclick = () => {
			const live = currentConvo();
			if (live) setStatusOf(live.id, live.status === 'closed' ? 'open' : 'closed');
		};
		head.appendChild(bolt);

		threadState.head = { name, sub, bolt };
		threadState.lockKey = '';
	}

	const h = threadState.head;
	setText(h.name, convo.name);
	setText(h.sub, convo.email || convo.pageUrl || 'Website visitor');

	// innerHTML on the lock button reparses an SVG, so it is only written when the state flips.
	const locked = convo.status === 'closed';
	const lockKey = locked ? 'locked' : 'open';
	if (threadState.lockKey !== lockKey) {
		threadState.lockKey = lockKey;
		h.bolt.className = 'icon-btn' + (locked ? ' locked' : '');
		h.bolt.innerHTML = locked ? ICONS.unlock : ICONS.lock;
		h.bolt.title = locked ? 'Unlock this chat' : 'Lock this chat';
		h.bolt.setAttribute('aria-label', h.bolt.title);
	}
}

function buildMessageNode(m, convo) {
	if (m.sender === 'system') return { root: el('div', 'sysline', m.text), sys: true };

	const out = m.sender === 'agent';
	const root = el('div', 'msg-wrap' + (out ? ' out' : ''));
	if (!out) root.appendChild(msgAvatar(m, convo));
	const bubble = el('div', 'bubble');
	// No read receipts. The app does not draw them in a bubble, so neither does this.
	// Text first, timestamp second. The old order relied on a float and short messages wrapped
	// themselves around it.
	const txt = el('span', 'txt', m.text);
	const meta = el('span', 'meta', clockLabel(m.createdAt));
	bubble.appendChild(txt);
	bubble.appendChild(meta);
	root.appendChild(bubble);
	return { root, bubble, txt, meta };
}

function paintMessageNode(entry, m) {
	if (entry.sys) {
		setText(entry.root, m.text);
		return;
	}
	setText(entry.txt, m.text);
	setText(entry.meta, clockLabel(m.createdAt));
}

function renderMessages(msgs, convo) {
	const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 90;

	// Day separators are keyed by their label, so they survive alongside the messages under them.
	const items = [];
	let lastDay = '';
	for (const m of state.messages) {
		const day = dayLabel(m.createdAt);
		if (day !== lastDay) {
			items.push({ key: 'day\u0001' + day, day });
			lastDay = day;
		}
		items.push({ key: 'msg\u0001' + m.id, m });
	}

	if (items.length === 0) {
		if (!msgNodes.has('empty')) {
			msgs.innerHTML = '';
			msgNodes.clear();
			const node = emptyState('chat', 'No messages yet', 'Nothing has been said in this thread.');
			msgs.appendChild(node);
			msgNodes.set('empty', { root: node });
		}
		return;
	}
	if (msgNodes.has('empty')) {
		msgs.innerHTML = '';
		msgNodes.clear();
	}

	let cursor = msgs.firstChild;
	let added = false;
	const seen = new Set();
	for (const item of items) {
		seen.add(item.key);
		let entry = msgNodes.get(item.key);
		if (!entry) {
			entry = item.m ? buildMessageNode(item.m, convo) : { root: el('div', 'daystamp', item.day) };
			msgNodes.set(item.key, entry);
			added = true;
			/*
			 * Only a message that arrives into a thread already on screen gets the rise
			 * animation, and it is dropped again once it has played. Opening a conversation
			 * paints its history flat, and an existing bubble that is merely moved or edited
			 * never animates - that replay across every bubble was the flash.
			 */
			if (threadState.painted && entry.bubble) {
				entry.bubble.classList.add('is-new');
				entry.bubble.addEventListener(
					'animationend',
					() => entry.bubble.classList.remove('is-new'),
					{ once: true },
				);
			}
		} else if (item.m) {
			paintMessageNode(entry, item.m);
		}
		if (entry.root !== cursor) msgs.insertBefore(entry.root, cursor);
		else cursor = cursor.nextSibling;
	}
	for (const [key, entry] of msgNodes) {
		if (seen.has(key)) continue;
		entry.root.remove();
		msgNodes.delete(key);
	}

	threadState.painted = true;
	// Only chase the bottom when something was actually appended. A read-receipt write used to
	// yank the view down while someone was reading further up.
	if (added && atBottom) requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
}

function renderComposer(foot, convo) {
	const mode = convo.status === 'pending' ? 'pending' : convo.status === 'closed' ? 'closed' : 'open';
	// The whole point: an unchanged composer is left exactly as the person left it, draft text,
	// caret, height, focus and all.
	if (threadState.composerMode === mode && foot.firstChild) return;
	threadState.composerMode = mode;
	foot.innerHTML = '';

	if (mode === 'pending') {
		const bar = el('div', 'startbar');
		const btn = el('button', 'btn', 'Start chat');
		btn.onclick = () => setStatusOf(threadState.convoId, 'open');
		bar.appendChild(btn);
		foot.appendChild(bar);
		return;
	}
	if (mode === 'closed') {
		const bar = el('div', 'startbar locked');
		const note = el('span', 'lock-note');
		note.innerHTML = ICONS.lock;
		note.appendChild(el('span', null, 'This chat is locked'));
		bar.appendChild(note);
		const undo = el('button', 'btn ghost', 'Unlock');
		undo.onclick = () => setStatusOf(threadState.convoId, 'open');
		bar.appendChild(undo);
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

/*
 * Settings, trimmed to what a browser can actually change.
 *
 * The previous version listed fourteen rows across five cards, and nine of them were marked
 * `app-only`: Link your website, Link a computer, Link social media accounts, Subscription,
 * Autostart, Chat wallpaper and friends. Tapping any of them did one thing - raise a toast
 * saying "Change this in Support Chat on your phone". That is not a setting, it is an
 * advertisement for a setting somewhere else, and nine of them buried the four rows that do
 * something behind a wall of dead ends.
 *
 * What is left is exactly the set of things this browser owns:
 *
 *   - who it is signed in as, stated once, as a fact rather than a control
 *   - notification permission, which is granted per browser and cannot be set from the phone
 *   - dark mode, which is stored in this browser's localStorage
 *   - the paired browser list, because revoking one is a console job
 *   - clear local cache and log out, which only exist on this side
 *   - help
 *
 * "Stay connected" went with the app-only rows. Its toggle was hardcoded to `on` and its
 * handler only ever printed a sentence: the browser listens while the tab is open and there is
 * no state behind the switch to flip.
 *
 * Storage and data lost its dialog. The sheet held two rows, one of which was a second Log out
 * next to the Log out card directly below it; clearing the cache is now the row itself.
 */
function renderSettings() {
	const dark = document.documentElement.dataset.theme === 'dark';
	const tenant = state.tenant || {};
	const email = tenant.email || 'Signed in on this browser';
	const plan = tenant.planName || tenant.plan || 'Free';
	const T = SETTING_TINTS;
	const notify = Notification.permission === 'granted';

	const html = '<div class="wrap">' +

		'<div class="card"><div class="card-title">This browser</div>' +
		settingsRow(ICONS.person, T.blue, email, plan + ' plan · signed in on this browser') +
		settingsRow(ICONS.bell, T.orange, 'Instant notifications',
			notify ? 'Allowed for this browser' : 'Not allowed yet',
			'<button class="switch' + (notify ? ' on' : '') + '" id="notifToggle"></button>') +
		settingsRow(ICONS.moon, T.indigo, 'Dark mode', 'Applies to this browser only.',
			'<button class="switch' + (dark ? ' on' : '') + '" id="darkToggle"></button>') +
		'</div>' +

		/*
		 * Still filled in by paintDeviceList after RTDB answers, not inline: settings is drawn
		 * synchronously on every tab switch and must not block on a network read.
		 */
		'<div class="card"><div class="card-title">Paired browsers</div>' +
		'<div id="deviceList"><div class="row"><div class="row-main"><b>Looking for paired ' +
		'browsers…</b><span>This takes a moment.</span></div></div></div>' +
		'</div>' +

		'<div class="card">' +
		settingsRow(ICONS.database, T.plum, 'Clear local cache',
			'Forgets the saved pairing on this browser only.',
			'<button class="btn ghost sm" id="clearCacheBtn">Clear</button>') +
		settingsRow(ICONS.help, T.bronze, 'Help and contact', 'Reach the team.',
			'<button class="btn ghost sm" id="helpBtn">Open</button>') +
		'</div>' +

		/*
		 * Log out keeps its own card at the end, in the danger colour, where a destructive
		 * action is expected and where it cannot be hit on the way to something else.
		 */
		'<div class="card">' +
		settingsRow(ICONS.logout, T.red, 'Log out', 'Unpairs this browser. Your phone stays signed in.',
			'<button class="btn danger sm" id="logoutBtn">Log out</button>') +
		'</div>' +

		'<div class="note">Support Chat Web 1.0.3</div></div>';

	$('#page-settings').innerHTML = html;
	paintDeviceList();

	$('#darkToggle').onclick = (e) => {
		const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
		applyTheme(next);
		e.currentTarget.classList.toggle('on', next === 'dark');
	};

	$('#notifToggle').onclick = async (e) => {
		if (Notification.permission === 'granted') {
			toast('Turn notifications off in your browser\u2019s site settings.');
			return;
		}
		const result = await Notification.requestPermission();
		e.currentTarget.classList.toggle('on', result === 'granted');
	};

	$('#clearCacheBtn').onclick = () => {
		storeSession(null);
		toast('Local cache cleared. Reload to pair again.');
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
