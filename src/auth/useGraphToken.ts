import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';
import { graphReadScopes } from './msal';

export function useGraphToken() {
  const { accounts, instance } = useMsal();

  const getAccessToken = useCallback(
    async (scopes = graphReadScopes): Promise<string> => {
      const account = instance.getActiveAccount() ?? accounts[0];

      if (!account) {
        throw new Error('No signed-in account is available.');
      }

      try {
        const response = await instance.acquireTokenSilent({ account, scopes });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup({ account, scopes });
          return response.accessToken;
        }

        throw error;
      }
    },
    [accounts, instance],
  );

  return { account: instance.getActiveAccount() ?? accounts[0], getAccessToken };
}
