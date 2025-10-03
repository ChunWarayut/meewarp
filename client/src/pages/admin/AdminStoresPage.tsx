import { type FormEvent, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

export type StoreRecord = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  timezone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
  timezone: 'Asia/Bangkok',
};

const AdminStoresPage = () => {
  const { token, admin } = useAuth();
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<Record<string, Partial<StoreRecord>>>({});

  const isSuperadmin = admin?.role === 'superadmin';

  const fetchStores = async () => {
    if (!token || !isSuperadmin) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_ENDPOINTS.adminStores, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load stores');
      }
      const data = (await response.json()) as StoreRecord[];
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      const response = await fetch(API_ENDPOINTS.adminStores, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Failed to create store');
      }

      setForm(emptyForm);
      await fetchStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  const updateStore = async (storeId: string, payload: Partial<StoreRecord>) => {
    if (!token) return;

    const response = await fetch(`${API_ENDPOINTS.adminStores}/${storeId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || 'Failed to update store');
    }
  };

  const handleToggleActive = async (store: StoreRecord) => {
    try {
      await updateStore(store._id, { isActive: !store.isActive });
      await fetchStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  const handleSaveEdit = async (storeId: string) => {
    const draft = editDrafts[storeId];
    if (!draft) {
      setEditingStore(null);
      return;
    }

    try {
      await updateStore(storeId, draft);
      setEditingStore(null);
      setEditDrafts((prev) => {
        const next = { ...prev };
        delete next[storeId];
        return next;
      });
      await fetchStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  if (!isSuperadmin) {
    return <p className="text-sm text-slate-300">เฉพาะ Superadmin เท่านั้นที่เข้าถึงหน้านี้ได้</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Stores</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Store Management</h1>
        <p className="mt-1 text-sm text-slate-300">สร้างและจัดการข้อมูลสาขาที่ใช้งาน meeWarp</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
        <h2 className="text-lg font-semibold text-white">สร้างสาขาใหม่</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Store Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Slug</label>
            <input
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              placeholder="เช่น bangkok-hq"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Phone</label>
            <input
              value={form.contactPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Timezone</label>
            <input
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              placeholder="Asia/Bangkok"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create Store'}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-300">Loading stores…</p>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => {
            const isEditing = editingStore === store._id;
            const draft = editDrafts[store._id] || {};
            return (
              <div
                key={store._id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{store.name}</h3>
                    <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">{store.slug}</p>
                    <p className="mt-2 text-sm text-slate-300">{store.description || '—'}</p>
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <p>Contact: {store.contactEmail || '—'} / {store.contactPhone || '—'}</p>
                      <p>Timezone: {store.timezone || '—'}</p>
                      <p>Last update: {store.updatedAt ? new Date(store.updatedAt).toLocaleString('th-TH') : '—'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.35em] ${
                        store.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'
                      }`}
                    >
                      {store.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(store)}
                        className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-white/30 hover:text-white"
                      >
                        {store.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStore(isEditing ? null : store._id);
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: isEditing
                              ? {}
                              : {
                                  name: store.name,
                                  slug: store.slug,
                                  contactEmail: store.contactEmail,
                                  contactPhone: store.contactPhone,
                                  description: store.description,
                                  timezone: store.timezone,
                                },
                          }));
                        }}
                        className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-white/30 hover:text-white"
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Store Name</label>
                      <input
                        value={draft.name ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], name: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Slug</label>
                      <input
                        value={draft.slug ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], slug: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Email</label>
                      <input
                        value={draft.contactEmail ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], contactEmail: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Contact Phone</label>
                      <input
                        value={draft.contactPhone ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], contactPhone: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Timezone</label>
                      <input
                        value={draft.timezone ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], timezone: event.target.value },
                          }))
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Description</label>
                      <textarea
                        value={draft.description ?? ''}
                        onChange={(event) =>
                          setEditDrafts((prev) => ({
                            ...prev,
                            [store._id]: { ...prev[store._id], description: event.target.value },
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(store._id)}
                        className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {stores.length === 0 ? (
            <p className="text-sm text-slate-300">ยังไม่มีข้อมูลสาขา</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AdminStoresPage;
