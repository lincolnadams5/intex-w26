import { useState } from "react";

type Recording = {
  id: number;
  resident: string;
  session_date: string;
  social_worker: string;
  session_type: "Individual" | "Group";
  session_duration_minutes: number;
  emotional_state_observed: string;
  emotional_state_end: string;
  session_narrative: string;
  interventions_applied: string;
  follow_up_actions: string;
  progress_noted: boolean;
  concerns_flagged: boolean;
  referral_made: boolean;
};

const emotionalStates = [
  "Calm",
  "Anxious",
  "Sad",
  "Angry",
  "Hopeful",
  "Withdrawn",
  "Happy",
  "Distressed"
];

export default function ProcessRecording() {
  const [resident, setResident] = useState("Maria Santos");

  const [records, setRecords] = useState<Recording[]>([]);

  const [form, setForm] = useState<Omit<Recording, "id" | "resident">>({
    session_date: "",
    social_worker: "",
    session_type: "Individual",
    session_duration_minutes: 60,
    emotional_state_observed: "",
    emotional_state_end: "",
    session_narrative: "",
    interventions_applied: "",
    follow_up_actions: "",
    progress_noted: false,
    concerns_flagged: false,
    referral_made: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: Recording = {
      id: Date.now(),
      resident,
      ...form
    };

    setRecords([newRecord, ...records]);

    setForm({
      session_date: "",
      social_worker: "",
      session_type: "Individual",
      session_duration_minutes: 60,
      emotional_state_observed: "",
      emotional_state_end: "",
      session_narrative: "",
      interventions_applied: "",
      follow_up_actions: "",
      progress_noted: false,
      concerns_flagged: false,
      referral_made: false
    });
  };

  const filtered = records.filter(r => r.resident === resident);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Process Recording</h1>

      {/* Resident */}
      <select
        value={resident}
        onChange={(e) => setResident(e.target.value)}
        className="border p-2 mb-6"
      >
        <option>Maria Santos</option>
        <option>Juan Dela Cruz</option>
      </select>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded space-y-3 mb-6">
        <input
          type="date"
          required
          value={form.session_date}
          onChange={(e) => setForm({ ...form, session_date: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Social Worker"
          required
          value={form.social_worker}
          onChange={(e) => setForm({ ...form, social_worker: e.target.value })}
          className="border p-2 w-full"
        />

        <select
          value={form.session_type}
          onChange={(e) =>
            setForm({
              ...form,
              session_type: e.target.value as "Individual" | "Group"
            })
          }
          className="border p-2 w-full"
        >
          <option>Individual</option>
          <option>Group</option>
        </select>

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={form.session_duration_minutes}
          onChange={(e) => setForm({ ...form, session_duration_minutes: Number(e.target.value) })}
          className="border p-2 w-full"
        />

        {/* Emotional states */}
        <select
          value={form.emotional_state_observed}
          onChange={(e) => setForm({ ...form, emotional_state_observed: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="">Start Emotional State</option>
          {emotionalStates.map(s => <option key={s}>{s}</option>)}
        </select>

        <select
          value={form.emotional_state_end}
          onChange={(e) => setForm({ ...form, emotional_state_end: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="">End Emotional State</option>
          {emotionalStates.map(s => <option key={s}>{s}</option>)}
        </select>

        <textarea
          placeholder="Session Narrative"
          value={form.session_narrative}
          onChange={(e) => setForm({ ...form, session_narrative: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Interventions Applied"
          value={form.interventions_applied}
          onChange={(e) => setForm({ ...form, interventions_applied: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Follow-Up Actions"
          value={form.follow_up_actions}
          onChange={(e) => setForm({ ...form, follow_up_actions: e.target.value })}
          className="border p-2 w-full"
        />

        {/* Checkboxes */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.progress_noted}
            onChange={(e) => setForm({ ...form, progress_noted: e.target.checked })}
          />
          Progress Noted
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.concerns_flagged}
            onChange={(e) => setForm({ ...form, concerns_flagged: e.target.checked })}
          />
          Concerns Flagged
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.referral_made}
            onChange={(e) => setForm({ ...form, referral_made: e.target.checked })}
          />
          Referral Made
        </label>

<br></br>
<br></br>
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Record
        </button>
      </form>

      {/* HISTORY */}
      <div>
        <h2 className="font-semibold mb-3">Session History</h2>

        {filtered.map(r => (
          <div key={r.id} className="border p-4 mb-3 rounded shadow-sm">
            <div className="flex justify-between">
              <strong>{r.session_date}</strong>
              <span>{r.session_type}</span>
            </div>

            <p><strong>Worker:</strong> {r.social_worker}</p>
            <p><strong>Duration:</strong> {r.session_duration_minutes} min</p>
            <p><strong>Start State:</strong> {r.emotional_state_observed}</p>
            <p><strong>End State:</strong> {r.emotional_state_end}</p>
            <p><strong>Summary:</strong> {r.session_narrative}</p>
            <p><strong>Interventions:</strong> {r.interventions_applied}</p>
            <p><strong>Follow-Up:</strong> {r.follow_up_actions}</p>

            <p className="text-sm mt-2">
              {r.progress_noted && "✔ Progress noted "}
              {r.concerns_flagged && "⚠ Concerns flagged "}
              {r.referral_made && "➡ Referral made"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}