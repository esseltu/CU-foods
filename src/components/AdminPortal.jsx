import { useEffect, useMemo, useState } from 'react'
import { createSpot, deleteSpot, getFirebaseConfigInfo, getSpots, getSpotsDataSource, updateSpot } from '../services/spotService'
import { FaArrowLeft, FaPlus, FaRedo, FaSearch, FaTrash, FaEdit } from 'react-icons/fa'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase'

const emptyDraft = {
  id: null,
  name: '',
  description: '',
  lat: '',
  lng: '',
  openHours: '',
  daysOpen: '',
  foodTypesText: '',
  price: '₵',
}

const toDraft = (spot) => {
  const foodTypes = Array.isArray(spot.foodTypes) ? spot.foodTypes : []
  return {
    id: spot.id ?? null,
    name: spot.name ?? '',
    description: spot.description ?? '',
    lat: spot.lat ?? '',
    lng: spot.lng ?? '',
    openHours: spot.openHours ?? '',
    daysOpen: spot.daysOpen ?? '',
    foodTypesText: foodTypes.join(', '),
    price: spot.price ?? '₵',
  }
}

const toSpotInput = (draft) => ({
  name: draft.name,
  description: draft.description,
  lat: draft.lat === '' ? '' : Number(draft.lat),
  lng: draft.lng === '' ? '' : Number(draft.lng),
  openHours: draft.openHours,
  daysOpen: draft.daysOpen,
  foodTypes: draft.foodTypesText
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  price: draft.price,
})

function AdminPortal() {
  const [authUser, setAuthUser] = useState(() => auth.currentUser)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [spots, setSpots] = useState([])
  const [source, setSource] = useState(getSpotsDataSource())
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const firebaseInfo = getFirebaseConfigInfo()
  const needsFirebaseLogin = firebaseInfo.configured
  const adminUids = (import.meta.env.VITE_ADMIN_UIDS || import.meta.env.VITE_ADMIN_UID || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await getSpots()
      setSpots(Array.isArray(data) ? data : [])
      setSource(getSpotsDataSource())
    } catch {
      setError('Failed to load food spots.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (needsFirebaseLogin && !auth.currentUser) return
    if (needsFirebaseLogin && adminUids.length === 0) return
    if (needsFirebaseLogin && !adminUids.includes(auth.currentUser.uid)) return
    load()
  }, [needsFirebaseLogin, authUser, adminUids.join(',')])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return spots
    return spots.filter(s => {
      const name = (s.name ?? '').toString().toLowerCase()
      const desc = (s.description ?? '').toString().toLowerCase()
      const types = Array.isArray(s.foodTypes) ? s.foodTypes.join(' ').toLowerCase() : ''
      return name.includes(q) || desc.includes(q) || types.includes(q)
    })
  }, [spots, query])

  const handleLogout = () => {
    setAuthError('')
    signOut(auth).catch(() => {})
    window.location.hash = ''
  }

  const handleFirebaseLogin = async () => {
    setAuthError('')
    setSaving(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setAuthError('')
    } catch (e) {
      const msg = e?.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled.'
        : e?.code === 'auth/popup-blocked'
          ? 'Popup blocked. Allow popups and try again.'
          : e?.code === 'auth/unauthorized-domain'
            ? 'Unauthorized domain. Add this domain in Firebase Authentication > Settings > Authorized domains.'
            : e?.message || 'Failed to sign in.'
      setAuthError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!needsFirebaseLogin) {
    return (
      <div className="h-screen w-full bg-white text-black flex flex-col">
        <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => { window.location.hash = '' }}
              className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner"
              aria-label="Back to map"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="font-semibold leading-tight truncate">Admin Portal</div>
              <div className="text-xs text-body leading-tight truncate">Firebase required</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-black/10 rounded-2xl p-5">
            <div className="font-semibold">Admin portal is disabled</div>
            <div className="text-sm text-body mt-1">Firebase configuration is required.</div>
            {firebaseInfo.missingEnv.length > 0 && (
              <div className="mt-3 text-sm text-white bg-black px-4 py-3 rounded-lg">
                Missing: {firebaseInfo.missingEnv.join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div className="h-screen w-full bg-white text-black flex flex-col">
        <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => { window.location.hash = '' }}
              className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner"
              aria-label="Back to map"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="font-semibold leading-tight truncate">Admin Portal</div>
              <div className="text-xs text-body leading-tight truncate">Firebase sign-in required</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-black/10 rounded-2xl p-5">
            <div className="font-semibold">Sign in</div>
            <div className="text-sm text-body mt-1">
              Use an account that has permission to write to Firestore.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleFirebaseLogin}
                disabled={saving}
                className="h-11 px-5 rounded-full bg-black text-white font-medium hover:bg-[#111111] active:shadow-inner disabled:opacity-50"
              >
                {saving ? 'Signing in…' : 'Sign in with Google'}
              </button>
            </div>

            {authError && (
              <div className="mt-3 text-sm text-white bg-black px-4 py-3 rounded-lg">
                {authError}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (adminUids.length === 0) {
    return (
      <div className="h-screen w-full bg-white text-black flex flex-col">
        <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => { window.location.hash = '' }}
              className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner"
              aria-label="Back to map"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="font-semibold leading-tight truncate">Admin Portal</div>
              <div className="text-xs text-body leading-tight truncate">Not configured</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-black/10 rounded-2xl p-5">
            <div className="font-semibold">Admin allowlist is not set</div>
            <div className="text-sm text-body mt-1">
              Set VITE_ADMIN_UIDS to your UID and redeploy.
            </div>
            <div className="mt-3 text-sm text-body break-all">
              Your UID: {authUser.uid}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(authUser.uid)}
                className="h-11 px-5 rounded-full bg-chip text-black font-medium hover:bg-hover active:shadow-inner"
              >
                Copy UID
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 px-5 rounded-full bg-black text-white font-medium hover:bg-[#111111] active:shadow-inner"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!adminUids.includes(authUser.uid)) {
    return (
      <div className="h-screen w-full bg-white text-black flex flex-col">
        <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => { window.location.hash = '' }}
              className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner"
              aria-label="Back to map"
            >
              <FaArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="font-semibold leading-tight truncate">Admin Portal</div>
              <div className="text-xs text-body leading-tight truncate">Access denied</div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-black/10 rounded-2xl p-5">
            <div className="font-semibold">This account is not an admin</div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 px-5 rounded-full bg-black text-white font-medium hover:bg-[#111111] active:shadow-inner"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const openCreate = () => {
    setDraft(emptyDraft)
    setIsFormOpen(true)
  }

  const openEdit = (spot) => {
    setDraft(toDraft(spot))
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setDraft(emptyDraft)
    setError('')
  }

  const validateDraft = () => {
    const name = draft.name.trim()
    if (!name) return 'Name is required.'
    const lat = Number(draft.lat)
    const lng = Number(draft.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Latitude and longitude must be valid numbers.'
    if (!draft.openHours.trim()) return 'Open hours is required.'
    if (!draft.daysOpen.trim()) return 'Days open is required.'
    return ''
  }

  const handleSave = async () => {
    const message = validateDraft()
    if (message) {
      setError(message)
      return
    }

    setError('')
    setSaving(true)
    try {
      const input = toSpotInput(draft)
      if (draft.id) {
        await updateSpot(draft.id, input)
      } else {
        await createSpot(input)
      }
      await load()
      closeForm()
    } catch (e) {
      const msg = e?.code === 'permission-denied'
        ? 'Permission denied. Check Firestore rules and make sure you are signed in as an admin.'
        : e?.message || 'Failed to save changes.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (spot) => {
    const ok = window.confirm(`Delete "${spot.name}"?`)
    if (!ok) return
    setError('')
    setSaving(true)
    try {
      await deleteSpot(spot.id)
      await load()
    } catch (e) {
      const msg = e?.code === 'permission-denied'
        ? 'Permission denied. Check Firestore rules and make sure you are signed in as an admin.'
        : e?.message || 'Failed to delete spot.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen w-full bg-white text-black flex flex-col">
      <div className="border-b border-black/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => { window.location.hash = '' }}
            className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner"
            aria-label="Back to map"
          >
            <FaArrowLeft size={14} />
          </button>
          <div className="min-w-0">
            <div className="font-semibold leading-tight truncate">Admin Portal</div>
            {source !== 'firebase' && firebaseInfo.missingEnv.length > 0 && (
              <div className="text-xs text-body leading-tight truncate">
                Firebase missing: {firebaseInfo.missingEnv.join(', ')}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={saving}
            className="h-10 px-4 rounded-full bg-chip text-black font-medium hover:bg-hover active:shadow-inner disabled:opacity-50"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={load}
            disabled={loading || saving}
            className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner disabled:opacity-50"
            aria-label="Refresh"
          >
            <FaRedo size={14} />
          </button>
          <button
            type="button"
            onClick={openCreate}
            disabled={saving}
            className="h-10 px-4 rounded-full bg-black text-white font-medium flex items-center gap-2 hover:bg-[#111111] active:shadow-inner disabled:opacity-50"
          >
            <FaPlus size={12} />
            Add
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-black/10">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, description, or food types"
            className="w-full pl-9 pr-3 py-3 rounded-lg bg-white border border-black text-sm text-black placeholder:text-muted focus:outline-none"
          />
        </div>
        {error && (
          <div className="mt-3 text-sm text-white bg-black px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto no-scrollbar">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {loading ? (
            <div className="text-sm text-body">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-body">No food spots found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map(spot => (
                <div key={spot.id} className="border border-black/10 rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{spot.name}</div>
                      <div className="text-xs text-body mt-1">
                        {spot.daysOpen} • {spot.openHours} • {spot.price}
                      </div>
                      {spot.description && (
                        <div className="text-sm text-body mt-2 leading-snug line-clamp-2">
                          {spot.description}
                        </div>
                      )}
                      <div className="text-xs text-body mt-2">
                        {Number(spot.lat).toFixed(6)}, {Number(spot.lng).toFixed(6)}
                      </div>
                      {Array.isArray(spot.foodTypes) && spot.foodTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {spot.foodTypes.slice(0, 6).map((t, idx) => (
                            <span key={idx} className="text-xs font-medium bg-chip text-black px-3 py-1 rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(spot)}
                        disabled={saving}
                        className="h-10 w-10 rounded-full bg-chip text-black flex items-center justify-center hover:bg-hover active:shadow-inner disabled:opacity-50"
                        aria-label="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(spot)}
                        disabled={saving}
                        className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#111111] active:shadow-inner disabled:opacity-50"
                        aria-label="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.20)]">
            <div className="px-5 py-4 border-b border-black/10 flex items-center justify-between gap-3">
              <div className="font-semibold">
                {draft.id ? 'Edit Spot' : 'Add Spot'}
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="h-10 px-4 rounded-full bg-chip text-black hover:bg-hover active:shadow-inner"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))}
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Price</span>
                <input
                  value={draft.price}
                  onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                  placeholder="₵₵"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-body">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                  rows={3}
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none resize-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Latitude</span>
                <input
                  value={draft.lat}
                  onChange={(e) => setDraft(d => ({ ...d, lat: e.target.value }))}
                  inputMode="decimal"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Longitude</span>
                <input
                  value={draft.lng}
                  onChange={(e) => setDraft(d => ({ ...d, lng: e.target.value }))}
                  inputMode="decimal"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Days Open</span>
                <input
                  value={draft.daysOpen}
                  onChange={(e) => setDraft(d => ({ ...d, daysOpen: e.target.value }))}
                  placeholder="Mon - Sat"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1">
                <span className="text-xs text-body">Open Hours</span>
                <input
                  value={draft.openHours}
                  onChange={(e) => setDraft(d => ({ ...d, openHours: e.target.value }))}
                  placeholder="07:00 - 20:00"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>

              <label className="text-sm flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs text-body">Food Types (comma-separated)</span>
                <input
                  value={draft.foodTypesText}
                  onChange={(e) => setDraft(d => ({ ...d, foodTypesText: e.target.value }))}
                  placeholder="Jollof, Waakye, Coffee"
                  className="px-3 py-3 rounded-lg border border-black text-sm focus:outline-none"
                />
              </label>
            </div>

            <div className="px-5 py-4 border-t border-black/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="h-11 px-5 rounded-full bg-chip text-black font-medium hover:bg-hover active:shadow-inner disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-11 px-5 rounded-full bg-black text-white font-medium hover:bg-[#111111] active:shadow-inner disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPortal
