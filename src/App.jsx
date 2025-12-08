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

  // Admin + historique
  const [isAdmin, setIsAdmin] = useState(false);
  const [history, setHistory] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  // Vérifier si admin
  async function checkAdmin(user_id) {
    const { data } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user_id)
      .single();

    if (data) setIsAdmin(true);
  }

  // Charger historique
  async function loadHistory(activeSession) {
    if (!activeSession?.user) return;

    const { data } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", activeSession.user.id)
      .order("session_start", { ascending: false });

    setHistory(data);

    // total du mois
    const currentMonth = new Date().getMonth();
    const total = data
      .filter((s) => new Date(s.session_start).getMonth() === currentMonth)
      .reduce((acc, s) => acc + s.co2_g / 1000, 0);

    setMonthlyTotal(total.toFixed(3));
  }

  // Auth + chargement admin + historique
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadHistory(data.session);
        checkAdmin(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadHistory(newSession);
          checkAdmin(newSession.user.id);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
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
      co2_g: Number(value) * 1000,
      session_start: new Date().toISOString(),
      session_end: new Date().toISOString(),
    });

    if (error) return alert("Erreur lors de l’enregistrement");

    setCo2(value);
    alert("Enregistré !");
    loadHistory(session);
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

      {isAdmin && (
        <button
          style={{ marginLeft: 10 }}
          onClick={() => (window.location.href = "/admin")}
        >
          Admin
        </button>
      )}

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

      <hr />

      <h2>Historique</h2>
      <p>
        Total CO₂ du mois : <strong>{monthlyTotal} kg</strong>
      </p>

      <table border="1" cellPadding="8" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Heures</th>
            <th>CO₂ (kg)</th>
          </tr>
        </thead>

        <tbody>
          {history.map((h) => (
            <tr key={h.id}>
              <td>{new Date(h.session_start).toLocaleDateString()}</td>
              <td>{(h.duration_seconds / 3600).toFixed(1)}</td>
              <td>{(h.co2_g / 1000).toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
