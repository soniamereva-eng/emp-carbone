import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";


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

    return () => listener.subscription.unsubscribe();
  }, []);


  async function signIn() {
    await supabase.auth.signInWithPassword({
      email: prompt("Email :"),
      password: prompt("Mot de passe :"),
    });
  }

  // 🔚 Logout
  async function signOut() {
    await supabase.auth.signOut();
  }

 
  function calculateCo2(hours) {
    return (hours * 0.055).toFixed(3);
  }

  
  async function submitHours() {
    if (!hours) return alert("Entre un nombre d’heures !");
    const value = calculateCo2(hours);

    const { error } = await supabase.from("empreinte").insert({
      user_id: session.user.id,
      hours: hours,
      co2: value,
      created_at: new Date(),
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
        <button onClick={signIn}>Se connecter</button>
      </div>
    );
  }


  return (
    <div style={{ padding: 30 }}>
      <h1>Empreinte carbone - Télétravail</h1>

      <p>Utilisateur : {session.user.email}</p>
      <button onClick={signOut}>Se déconnecter</button>

      <hr />

      <label>Heures de télétravail :</label>
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
          Empreinte CO₂ calculée : <strong>{co2} kg</strong>
        </p>
      )}
    </div>
  );
}
