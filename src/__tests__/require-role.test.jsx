import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import RequireRole from '@/components/RequireRole';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

// This is a smoke test to ensure RequireRole renders unauthorized when no profile exists
describe('RequireRole', () => {
  it('renders unauthorized message when no profile', () => {
    const { getByText } = render(
      <AuthProvider>
        <RequireRole role="vendor">
          <div>Protected</div>
        </RequireRole>
      </AuthProvider>
    );

    expect(getByText(/You do not have the required permissions/i)).toBeTruthy();
  });
});
