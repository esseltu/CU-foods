import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { mockSpots } from '../data/mockSpots';

const COLLECTION_NAME = import.meta.env.VITE_FIREBASE_SPOTS_COLLECTION || 'foodSpots';
const LOCAL_STORAGE_KEY = 'cu_foods_spots_v1';

const isFirebaseConfigured = () => {
  try {
    const options = db?.app?.options ?? {};
    const apiKey = options.apiKey;
    const projectId = options.projectId;
    if (!apiKey || !projectId) return false;
    if (apiKey === 'YOUR_API_KEY' || projectId === 'YOUR_PROJECT_ID') return false;
    return true;
  } catch {
    return false;
  }
};

const getMissingFirebaseEnvVars = () => {
  const options = db?.app?.options ?? {};
  const mapping = [
    ['apiKey', 'VITE_FIREBASE_API_KEY'],
    ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
    ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
    ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'],
    ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'],
    ['appId', 'VITE_FIREBASE_APP_ID'],
  ];

  return mapping
    .filter(([key]) => !options[key])
    .map(([, env]) => env);
};

export const getFirebaseConfigInfo = () => ({
  configured: isFirebaseConfigured(),
  missingEnv: getMissingFirebaseEnvVars(),
  collection: COLLECTION_NAME,
});

const loadLocalSpots = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveLocalSpots = (spots) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(spots));
};

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const normalizeSpotInput = (spot) => {
  const lat = typeof spot.lat === 'string' ? Number(spot.lat) : spot.lat;
  const lng = typeof spot.lng === 'string' ? Number(spot.lng) : spot.lng;
  const foodTypes = Array.isArray(spot.foodTypes)
    ? spot.foodTypes
    : typeof spot.foodTypes === 'string'
      ? spot.foodTypes.split(',').map(s => s.trim()).filter(Boolean)
      : [];

  return {
    name: (spot.name ?? '').toString().trim(),
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    openHours: (spot.openHours ?? '').toString().trim(),
    daysOpen: (spot.daysOpen ?? '').toString().trim(),
    foodTypes,
    price: (spot.price ?? '₵').toString().trim(),
    description: (spot.description ?? '').toString().trim(),
  };
};

export const getSpotsDataSource = () => {
  if (isFirebaseConfigured()) return 'firebase';
  const local = loadLocalSpots();
  if (local && local.length) return 'local';
  return 'mock';
};

export const getSpots = async () => {
  if (!isFirebaseConfigured()) {
    const local = loadLocalSpots();
    if (local && local.length) {
      const cleaned = local.filter(s => typeof s?.id !== 'number');
      if (cleaned.length !== local.length) saveLocalSpots(cleaned);
      return cleaned;
    }
    return mockSpots;
  }

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    if (querySnapshot.empty) return mockSpots;

    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch {
    return mockSpots;
  }
};

export const createSpot = async (spot) => {
  const input = normalizeSpotInput(spot);

  if (!isFirebaseConfigured()) {
    const existing = loadLocalSpots() ?? [];
    const created = { id: createLocalId(), ...input };
    const next = [created, ...existing];
    saveLocalSpots(next);
    return created;
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), input);
  return { id: docRef.id, ...input };
};

export const updateSpot = async (id, patch) => {
  const input = normalizeSpotInput(patch);

  if (!isFirebaseConfigured()) {
    const existing = loadLocalSpots() ?? [];
    const next = existing.map(s => `${s.id}` === `${id}` ? { ...s, ...input, id: s.id } : s);
    saveLocalSpots(next);
    return next.find(s => `${s.id}` === `${id}`) ?? null;
  }

  await updateDoc(doc(db, COLLECTION_NAME, id), input);
  return { id, ...input };
};

export const deleteSpot = async (id) => {
  if (!isFirebaseConfigured()) {
    const existing = loadLocalSpots() ?? [];
    const next = existing.filter(s => `${s.id}` !== `${id}`);
    saveLocalSpots(next);
    return true;
  }

  await deleteDoc(doc(db, COLLECTION_NAME, id));
  return true;
};
