import * as Clerk from '@clerk/expo';

// Local end-to-end testing only: a fixed test user instead of Clerk. Needs a dev build AND the env flag,
// so APKs (production builds, no flag in eas.json) always use real Clerk sign-in.
export const DEV_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_AUTH === '1';

const devUser = { firstName: 'Test', lastName: 'User', primaryEmailAddress: { emailAddress: 'test@rupli.dev' } };
const useDevAuth = () => ({ isLoaded: true, isSignedIn: true, userId: 'user_dev', getToken: async () => 'dev' }) as unknown as ReturnType<typeof Clerk.useAuth>;
const useDevUser = () => ({ isLoaded: true, isSignedIn: true, user: devUser }) as unknown as ReturnType<typeof Clerk.useUser>;
const useDevClerk = () => ({ signOut: async () => {}, setActive: async () => {} }) as unknown as ReturnType<typeof Clerk.useClerk>;

// chosen once at load, so hook order never changes between renders
export const useAuth = DEV_AUTH ? useDevAuth : Clerk.useAuth;
export const useUser = DEV_AUTH ? useDevUser : Clerk.useUser;
export const useClerk = DEV_AUTH ? useDevClerk : Clerk.useClerk;
