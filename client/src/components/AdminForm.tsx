import { ChangeEvent, FormEvent, useState } from 'react';
import { API_ENDPOINTS } from '../config';

type FormValues = {
  code: string;
  name: string;
  socialLink: string;
};

type AdminFormProps = {
  authToken: string;
  onLogout: () => void;
};

const defaultValues: FormValues = {
  code: '',
  name: '',
  socialLink: '',
};

const AdminForm = ({ authToken, onLogout }: AdminFormProps) => {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleChange = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.createWarpProfile, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        onLogout();
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'Failed to create warp profile');
      }

      setStatus('success');
      setMessage('Warp profile created successfully.');
      setValues(defaultValues);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unexpected error occurred');
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <section className="mx-auto w-full max-w-xl rounded-xl bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Create Warp Profile</h1>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-transparent bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300"
        >
          Log out
        </button>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            value={values.code}
            onChange={handleChange('code')}
            required
            placeholder="e.g. DJ001"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange('name')}
            required
            placeholder="Staff member name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="socialLink">
            Social Link
          </label>
          <input
            id="socialLink"
            name="socialLink"
            type="url"
            value={values.socialLink}
            onChange={handleChange('socialLink')}
            required
            placeholder="https://instagram.com/username"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Submitting…' : 'Create Warp Profile'}
        </button>
      </form>

      {status !== 'idle' && message && (
        <p
          className={`mt-4 text-sm ${
            status === 'success' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
};

export default AdminForm;
