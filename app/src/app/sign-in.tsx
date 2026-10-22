import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo';
import { useSSO } from '@clerk/expo/experimental';
import Svg, { Path } from 'react-native-svg';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';

import { font, useTheme } from '../theme';
import { EmojiTile, IconButton, PrimaryButton, Txt } from '../ui/core';
import { Screen } from '../ui/layout';
import { SafeAreaView } from 'react-native-safe-area-context';

// lets the auth browser hand the Google result back to this screen
WebBrowser.maybeCompleteAuthSession();

const TILES = [
  { e: '🥛', l: 28, t: 26, s: 64, r: 20, rot: '-8deg', bg: 'yellow' }, { e: '🧅', l: 118, t: 70, s: 56, r: 18, rot: '6deg', bg: 'cream' },
  { e: '🍚', l: 200, t: 18, s: 68, r: 22, rot: '-4deg', bg: 'cream' }, { e: '🫘', l: 292, t: 84, s: 60, r: 20, rot: '10deg', bg: 'yellow' },
  { e: '🧴', l: 46, t: 132, s: 52, r: 16, rot: '12deg', bg: 'cream' }, { e: '₹', l: 186, t: 146, s: 58, r: 18, rot: '-10deg', bg: 'chili' },
] as const;

function GoogleG() {
  return (
    <Svg width={24} height={24} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

export default function SignIn() {
  const { c } = useTheme();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [flow, setFlow] = useState<'in' | 'up'>('in');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(24);
  const codeRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step !== 'otp' || wait <= 0) return;
    const t = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(t);
  }, [step, wait]);

  async function sendCode() {
    setBusy(true); setError(null);
    try {
      const r = await signIn.emailCode.sendCode({ emailAddress: email.trim() });
      if (!r.error) { setFlow('in'); }
      else if (r.error.code === 'form_identifier_not_found') {
        const u = await signUp.create({ emailAddress: email.trim() });
        if (u.error) throw u.error;
        const s = await signUp.verifications.sendEmailCode();
        if (s.error) throw s.error;
        setFlow('up');
      } else throw r.error;
      setStep('otp'); setCode(''); setWait(24);
      setTimeout(() => codeRef.current?.focus(), 300);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send the code'); }
    finally { setBusy(false); }
  }

  async function verify() {
    setBusy(true); setError(null);
    try {
      if (flow === 'in') {
        const r = await signIn.emailCode.verifyCode({ code });
        if (r.error) throw r.error;
        const f = await signIn.finalize();
        if (f.error) throw f.error;
      } else {
        const r = await signUp.verifications.verifyEmailCode({ code });
        if (r.error) throw r.error;
        const f = await signUp.finalize();
        if (f.error) throw f.error;
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'That code did not work'); }
    finally { setBusy(false); }
  }

  async function google() {
    setError(null);
    try { await startSSOFlow({ strategy: 'oauth_google' }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Google sign-in failed'); }
  }

  if (step === 'otp') {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ height: 56, justifyContent: 'center', paddingHorizontal: 12 }}>
          <IconButton label="Back" onPress={() => setStep('email')}><ChevronLeft size={22} strokeWidth={2.5} color={c.ink} /></IconButton>
        </View>
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          <EmojiTile emoji="📬" size={64} bg="mint" r={20} />
          <Txt v="title" size={34} style={{ marginTop: 18, marginBottom: 8 }}>Check your email</Txt>
          <Txt size={17} color="mute">Code sent to <Txt w="700" size={17}>{email.trim()}</Txt></Txt>
          <Pressable onPress={() => codeRef.current?.focus()} style={{ flexDirection: 'row', gap: 8, marginTop: 32 }}>
            {Array.from({ length: 6 }, (_, i) => {
              const filled = i < code.length, active = i === code.length;
              return (
                <View key={i} style={{
                  flex: 1, height: 64, borderRadius: 16, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center',
                  borderWidth: active ? 2.5 : filled ? 2 : 1.5, borderColor: active ? c.ink : filled ? c.green : c.line,
                  boxShadow: active ? `0 0 0 4px ${c.yellow}` : undefined,
                }}>
                  {filled ? <Txt w="800" size={30}>{code[i]}</Txt> : active ? <View style={{ width: 2, height: 28, backgroundColor: c.ink }} /> : null}
                </View>
              );
            })}
          </Pressable>
          <TextInput ref={codeRef} value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad"
            textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }} />
          {wait > 0
            ? <Txt size={15} color="mute" style={{ marginTop: 18 }}>Resend code in <Txt w="700" size={15}>0:{String(wait).padStart(2, '0')}</Txt></Txt>
            : <Pressable onPress={sendCode} style={{ marginTop: 18 }}><Txt w="600" size={15} color="green">Resend code</Txt></Pressable>}
          {error && <Txt size={14} color="chili" style={{ marginTop: 12 }}>{error}</Txt>}
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ paddingHorizontal: 24, paddingBottom: 18, gap: 8 }}>
          <PrimaryButton label="Verify" disabled={code.length < 6 || busy} onPress={verify} right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
          <Pressable onPress={() => setStep('email')} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
            <Txt w="600" size={16} color="green">Use a different email</Txt>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']} style={{ backgroundColor: c.green, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, paddingBottom: 28, overflow: 'hidden' }}>
            <View style={{ height: 220 }}>
              {TILES.map(t => (
                <View key={t.e} style={{
                  position: 'absolute', left: t.l, top: t.t, width: t.s, height: t.s, borderRadius: t.r, transform: [{ rotate: t.rot }],
                  backgroundColor: t.bg === 'yellow' ? c.yellow : t.bg === 'chili' ? c.chili : '#FFF6E6', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.e === '₹' ? <Txt w="800" size={30} style={{ color: '#fff' }}>₹</Txt> : <Txt size={Math.round(t.s * 0.53)}>{t.e}</Txt>}
                </View>
              ))}
            </View>
            <View style={{ paddingHorizontal: 24 }}>
              <Txt color="onGreen" style={{ fontFamily: font.wordmark, fontSize: 68, lineHeight: 64, letterSpacing: -2.7 }}>
                rupli<Txt style={{ fontFamily: font.wordmark, fontSize: 68, color: c.yellow }}>●</Txt>
              </Txt>
              <Txt color="onGreen" size={20} style={{ marginTop: 12, maxWidth: 300, lineHeight: 26, opacity: 0.92 }}>
                The monthly kirana, listed, shopped and tracked with one hand.
              </Txt>
            </View>
          </SafeAreaView>
          <View style={{ flex: 1 }} />
          <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 24, paddingBottom: 18, paddingTop: 24, gap: 12 }}>
            <Pressable accessibilityRole="button" onPress={google} style={{
              height: 56, borderRadius: 18, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.line,
              flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18,
            }}>
              <GoogleG /><Txt w="600" size={17}>Continue with Google</Txt>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, height: 1.5, backgroundColor: c.line }} /><Txt size={14} color="mute">or</Txt><View style={{ flex: 1, height: 1.5, backgroundColor: c.line }} />
            </View>
            <TextInput value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={c.mute} keyboardType="email-address"
              autoCapitalize="none" autoComplete="email" textContentType="emailAddress" style={{
                height: 56, borderRadius: 18, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.card, paddingHorizontal: 18,
                fontSize: 17, fontFamily: font.regular, color: c.ink,
              }} />
            {error && <Txt size={14} color="chili">{error}</Txt>}
            <PrimaryButton label="Send OTP" disabled={!/^\S+@\S+\.\S+$/.test(email.trim()) || busy} onPress={sendCode}
              right={<ArrowRight size={22} strokeWidth={2.5} color={c.onYellow} />} />
            <Txt size={13} color="mute" style={{ textAlign: 'center', marginTop: 2 }}>By continuing you agree to the Terms and Privacy Policy</Txt>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
