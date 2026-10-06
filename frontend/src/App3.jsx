import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';

function Test() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div>Clerk is loading...</div>;
  return <div>Clerk loaded! Signed in: {String(isSignedIn)}</div>;
}

export default function App3() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Test />
    </ClerkProvider>
  );
}
