import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Admin() {
  const [session, setSession] = useState(null);
  const [usersStats, setUsersStats] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadStats();
    });
  }, []);

  async function loadStats() {
    const { data } = await supabase
      .from("sessions")
      .select("user_id, display_name, duration_seconds, co2_g");

    const stats = {};
    data.forEach((s) => {
      if (!stats[s.user_id]) {
        stats[s.user_id] = {
          email: s.display_name,
          hours: 0,
          co2: 0,
        };
      }
      stats[s.user_id].hours += s.duration_seconds / 3600;
      stats[s.user_id].co2 += s.co2_g / 1000;
    });

    setUsersStats(Object.values(stats));
  }

  if (!session) return <p>Chargement…</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin – Statistiques globales</h1>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Total heures</th>
            <th>Total CO₂ (kg)</th>
          </tr>
        </thead>
        <tbody>
          {usersStats.map((u) => (
            <tr key={u.email}>
              <td>{u.email}</td>
              <td>{u.hours.toFixed(1)}</td>
              <td>{u.co2.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
