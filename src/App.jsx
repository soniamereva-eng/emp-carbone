import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase config via Vite env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [hours, setHours] = useState("");
  const [co2, setCo2] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function signIn() {
    const email = prompt("Ton email :");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert("Erreur: " + error.message);
    else alert("Lien magique envoyé dans ton email (vérifie spam).");
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
      co2_g: Number(value) * 1000,
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="p-8 rounded-lg bg-slate-800 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Connexion requise</h2>
          <button
            onClick={signIn}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-md text-white font-semibold"
          >
            Se connecter (magic link)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Empreinte carbone</h1>
            <p className="text-sm text-slate-400">Utilisateur : {session.user.email}</p>
          </div>
          <button onClick={signOut} className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md">
            Déconnexion
          </button>
        </header>

        <main className="mt-8 bg-slate-800 p-6 rounded-lg shadow">
          <label className="block text-lg mb-2">Heures utilisées aujourd’hui :</label>
          <div className="flex items-center">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="ex: 8"
              className="px-4 py-2 rounded-md bg-slate-700 border border-slate-600 text-white"
            />
            <button
              onClick={submitHours}
              className="ml-4 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md"
            >
              Enregistrer
            </button>
          </div>

          {co2 && (
            <p className="mt-4 text-lg">
              Empreinte CO₂ estimée : <span className="font-bold text-green-300">{co2} kg</span>
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
