import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase sera configuré avec les env vars Vercel
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [hours, setHours] = useState("");
  const [co2, setCo2] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      try { listener.subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  async function signIn() {
    // magic link flow simple (email)
    const email = prompt("Email :");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert("Erreur : " + error.message);
    else alert("Lien envoyé, ouvre ton email");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  function calculateCo2(hours) {
    return (hours * 0.055).toFixed(3);
  }

  async function submitHours() {
    if (!hours) return alert("Entre un nombre d’heures !");
    const value = calculateCo2(hours);

    const { error } = await supabase.from("sessions").insert({
      user_id: session.user.id,
      display_name: session.user.email,
      duration_seconds: Number(hours) * 3600,
      estimated_kwh: (Number(hours) * 0.05) / 1000,
      co2_g: Number(value) * 1000, // store in grams
      session_start: new Date().toISOString(),
      session_end: new Date().toISOString()
    });

    if (error) {
      console.error(error);
      return alert("Erreur lors de l’enregistrement");
    }

    setCo2(value);
    alert("Enregistré !");
  }

  if (!session) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Connexion requise</h2>
        <button onClick={signIn}>Se connecter (magic link)</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Empreinte carbone</h1>
      <p>Utilisateur : {session.user.email}</p>
      <button onClick={signOut}>Se déconnecter</button>

      <hr />

      <label>Heures utilisées aujourd’hui :</label>
      <input
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        placeholder="ex: 8"
        style={{ marginLeft: 10 }}
      />
      <button onClick={submitHours} style={{ marginLeft: 10 }}>
        Enregistrer
      </button>

      {co2 && (
        <p>
          Empreinte CO₂ estimée : <strong>{co2} kg</strong>
        </p>
      )}
    </div>
  );
}
