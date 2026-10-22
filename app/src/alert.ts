import { Alert } from 'react-native';

// for flows that need the server's answer (new list, start trip…): say what went wrong instead of failing silently
export const withAlert = <A extends unknown[]>(title: string, fn: (...a: A) => Promise<unknown>) => async (...a: A) => {
  try { await fn(...a); }
  catch (e) { Alert.alert(title, e instanceof Error && !/abort|network/i.test(e.message) ? e.message : 'You seem to be offline. Try again when you have network.'); }
};
