import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔹 Configure ton client Supabase ici
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [hours, setHours] = useState(8);
  const [co2, setCo2] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  async function signIn() {
    const email = prompt("Entrez votre email professionnel :");
    if (!email) return;

    await supabase.auth.signInWithOtp({ email });
    alert("Lien de connexion envoyé 👌");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function saveToSupabase(value) {
    if (!session) return;

    await supabase.from("sessions").insert({
      user_id: session.user.id,
      duration_seconds: hours * 3600,
      estimated_kwh: value / 1000,
      co2_g: value
    });

    alert("Données enregistrées ✔️");
  }

  function calculate() {
    const grams = hours * 50; // 🔹 50 gCO2/h par défaut (simplifié)
    setCo2(grams);
    saveToSupabase(grams);
  }

  if (!session)
    return (
      <div style={{ padding: 20 }}>
        <h2>Connexion</h2>
        <button onClick={signIn}>Se connecter</button>
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      <h2>Bienvenue</h2>
      <button onClick={signOut}>Se déconnecter</button>

      <h3>Calcul de l'empreinte carbone</h3>

      <label>Heures travaillées aujourd’hui :</label>
      <input
        type="number"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
      />

      <button onClick={calculate}>Calculer</button>

      {co2 !== null && (
        <p>
          Empreinte estimée : <strong>{co2} g CO₂</strong>
        </p>
      )}
    </div>
  );
}
