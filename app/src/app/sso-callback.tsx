import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth, useClerk } from '../auth';
import { useTheme } from '../theme';
import { Txt } from '../ui/core';

// Google sends the user back to rupli://sso-callback. If the sign-in screen's SSO promise already
// activated the session we just go home; otherwise (Android reopened the app via the link) activate it here.
export default function SsoCallback() {
  const { c } = useTheme();
  const { created_session_id } = useLocalSearchParams<{ created_session_id?: string }>();
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) { router.replace('/'); return; }
    if (!created_session_id) { router.replace('/sign-in'); return; }
    clerk.setActive({ session: created_session_id })
      .then(() => router.replace('/'))
      .catch(() => router.replace('/sign-in'));
  }, [isLoaded, isSignedIn, created_session_id, clerk]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator color={c.green} size="large" />
      <Txt color="mute">Signing you in…</Txt>
    </View>
  );
}
