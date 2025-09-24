import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLogin from '../AdminLogin';
import { API_ENDPOINTS } from '../../config';

describe('AdminLogin', () => {
  const mockFetch = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    onSuccess.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('logs in successfully and returns token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-token', expiresIn: '1h' }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AdminLogin onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        API_ENDPOINTS.adminLogin,
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(onSuccess).toHaveBeenCalledWith('jwt-token');
  });

  test('renders error message on invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    } as unknown as Response);

    const user = userEvent.setup();
    render(<AdminLogin onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
