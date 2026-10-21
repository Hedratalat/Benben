// Who is signed in right now (and their role). Use it anywhere: const { user, role, loading } = useAuth();
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function useAuth() {
  const [state, setState] = useState({
    user: auth.currentUser,
    role: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;

      if (!user) {
        setState({ user: null, role: null, loading: false });
        return;
      }

      // Show the avatar right away, then fill in the role
      setState((s) => ({ ...s, user, loading: false }));

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!cancelled) {
          setState({
            user,
            role: snap.exists() ? snap.data().role || "user" : "user",
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setState({ user, role: "user", loading: false });
      }
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return state;
}
