import { ZSTDDecoder } from "https://cdn.jsdelivr.net/npm/zstddec@0.1.0/+esm";

// Increment to invalidate old data
const FRAME_VERSION = 1;
const DB_NAME = "bad-apple";
// Increment to update schema
const DB_VERSION = 1;
const CACHE_NAME = `bad-apple-cache-v${FRAME_VERSION}`;
const FRAME_SIZE = 71835360;

const promisify = (target) => {
	return new Promise((resolve, reject) => {
		if (target instanceof IDBRequest) {
			target.onsuccess = () => resolve(target.result);
			target.onerror = () => reject(target.error);
		} else if (target instanceof IDBTransaction) {
			target.oncomplete = () => resolve();
			target.onerror = () => reject(target.error);
			target.onabort = () =>
				reject(target.error || new Error("Transaction aborted"));
		} else {
			reject(new TypeError("Expected IDBRequest or IDBTransaction"));
		}
	});
};

let dbPromise;
const openDB = () => {
	if (!dbPromise) {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			req.result.createObjectStore("framesData");
		};
		dbPromise = promisify(req).then((db) => {
			db.onclose = () => {
				dbPromise = null;
			};
			return db;
		});
	}
	return dbPromise;
};

const getFramesFromDB = async () => {
	const db = await openDB();
	const tx = db.transaction("framesData", "readonly");
	const req = tx.objectStore("framesData").get("bad-apple");
	const result = await promisify(req);
	return result && result.version === FRAME_VERSION ? result.data : null;
};

const saveFramesToDB = async (framesData) => {
	const db = await openDB();
	const tx = db.transaction("framesData", "readwrite");
	const req = tx
		.objectStore("framesData")
		.put({ version: FRAME_VERSION, data: framesData }, "bad-apple");
	await promisify(req);
	await promisify(tx);
};

const getZstFromCache = async (url) => {
	const cache = await caches.open(CACHE_NAME);
	let response = await cache.match(url);
	if (!response) {
		response = await fetch(url);
		await cache.put(url, response.clone());
	}
	return new Uint8Array(await response.arrayBuffer());
};

const loadFrames = async () => {
	const cachedFramesData = await getFramesFromDB();
	if (cachedFramesData) {
		return cachedFramesData;
	}

	const decoder = new ZSTDDecoder();
	await decoder.init();

	try {
		const compressed = await getZstFromCache(
			"../assets/ascii/BadAppleASCII.zst",
		);

		const decompressed = decoder.decode(compressed, FRAME_SIZE);
		const text = new TextDecoder("utf-8").decode(decompressed);
		const framesData = JSON.parse(text);

		await saveFramesToDB(framesData);

		return framesData;
	} catch (err) {
		await caches.delete(CACHE_NAME);
		const db = await openDB();
		const tx = db.transaction("framesData", "readwrite");
		const req = tx.objectStore("framesData").clear();
		await promisify(req);
		await promisify(tx);
		throw err;
	}
};

export default loadFrames;
