import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminForm from '../AdminForm';
import { API_ENDPOINTS } from '../../config';

describe('AdminForm', () => {
  const mockFetch = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    onLogout.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('submits data and shows success message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        code: 'DJ001',
        name: 'Test DJ',
        socialLink: 'https://instagram.com/testdj',
        isActive: true,
      }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AdminForm authToken="fake-token" onLogout={onLogout} />);

    await user.type(screen.getByLabelText(/code/i), 'DJ001');
    await user.type(screen.getByLabelText(/name/i), 'Test DJ');
    await user.type(screen.getByLabelText(/social link/i), 'https://instagram.com/testdj');

    await user.click(screen.getByRole('button', { name: /create warp profile/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        API_ENDPOINTS.createWarpProfile,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
        }),
      );
    });

    expect(await screen.findByText(/Warp profile created successfully/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toHaveValue('');
    expect(onLogout).not.toHaveBeenCalled();
  });

  test('shows error message when request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Warp code already exists' }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AdminForm authToken="fake-token" onLogout={onLogout} />);

    await user.type(screen.getByLabelText(/code/i), 'DJ001');
    await user.type(screen.getByLabelText(/name/i), 'Test DJ');
    await user.type(screen.getByLabelText(/social link/i), 'https://instagram.com/testdj');

    await user.click(screen.getByRole('button', { name: /create warp profile/i }));

    expect(await screen.findByText(/Warp code already exists/i)).toBeInTheDocument();
    expect(onLogout).not.toHaveBeenCalled();
  });

  test('logs out when session is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AdminForm authToken="fake-token" onLogout={onLogout} />);

    await user.type(screen.getByLabelText(/code/i), 'DJ001');
    await user.type(screen.getByLabelText(/name/i), 'Test DJ');
    await user.type(screen.getByLabelText(/social link/i), 'https://instagram.com/testdj');

    await user.click(screen.getByRole('button', { name: /create warp profile/i }));

    await waitFor(() => {
      expect(onLogout).toHaveBeenCalled();
    });

    expect(await screen.findByText(/Session expired/i)).toBeInTheDocument();
  });
});
