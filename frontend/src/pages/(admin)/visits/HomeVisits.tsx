import { useState, useEffect } from "react";

type HomeVisit = {
  id: number;
  resident: string;
  visit_date: string;
  social_worker: string;
  visit_type:
    | "Initial Assessment"
    | "Routine Follow-up"
    | "Reintegration Assessment"
    | "Post-Placement Monitoring"
    | "Emergency";
  location_visited: string;
  family_members_present: string;
  purpose: string;
  observations: string;
  family_cooperation_level: string;
  safety_concerns_noted: string;
  follow_up_needed: boolean;
  follow_up_notes: string;
  visit_outcome: string;
};

type CaseConference = {
  id: number;
  resident: string;
  case_conference_date: string;
  plan_description: string;
  status: "Completed" | "Upcoming";
};

export default function HomeVisits() {
  const [resident, setResident] = useState("Maria Santos");

  const [visits, setVisits] = useState<HomeVisit[]>([]);
  const [conferences, setConferences] = useState<CaseConference[]>([]);

  const [form, setForm] = useState<Omit<HomeVisit, "id" | "resident">>({
    visit_date: "",
    social_worker: "",
    visit_type: "Initial Assessment",
    location_visited: "",
    family_members_present: "",
    purpose: "",
    observations: "",
    family_cooperation_level: "",
    safety_concerns_noted: "",
    follow_up_needed: false,
    follow_up_notes: "",
    visit_outcome: ""
  });

  // Mock Case Conferences
  useEffect(() => {
    setConferences([
      {
        id: 1,
        resident: "Maria Santos",
        case_conference_date: "2026-04-10",
        plan_description: "Reintegration planning session",
        status: "Upcoming"
      },
      {
        id: 2,
        resident: "Maria Santos",
        case_conference_date: "2026-03-01",
        plan_description: "Initial intervention planning",
        status: "Completed"
      }
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVisit: HomeVisit = {
      id: Date.now(),
      resident,
      ...form
    };

    setVisits([newVisit, ...visits]);

    setForm({
      visit_date: "",
      social_worker: "",
      visit_type: "Initial Assessment",
      location_visited: "",
      family_members_present: "",
      purpose: "",
      observations: "",
      family_cooperation_level: "",
      safety_concerns_noted: "",
      follow_up_needed: false,
      follow_up_notes: "",
      visit_outcome: ""
    });
  };

  const filteredVisits = visits.filter(v => v.resident === resident);
  const upcoming = conferences.filter(c => c.status === "Upcoming" && c.resident === resident);
  const history = conferences.filter(c => c.status === "Completed" && c.resident === resident);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Home Visitations & Case Conferences
      </h1>

      {/* Resident Selector */}
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
          value={form.visit_date}
          onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Social Worker"
          value={form.social_worker}
          onChange={(e) => setForm({ ...form, social_worker: e.target.value })}
          className="border p-2 w-full"
        />

        <select
          value={form.visit_type}
          onChange={(e) =>
            setForm({
              ...form,
              visit_type: e.target.value as HomeVisit["visit_type"]
            })
          }
          className="border p-2 w-full"
        >
          <option>Initial Assessment</option>
          <option>Routine Follow-up</option>
          <option>Reintegration Assessment</option>
          <option>Post-Placement Monitoring</option>
          <option>Emergency</option>
        </select>

        <input
          placeholder="Location Visited"
          value={form.location_visited}
          onChange={(e) => setForm({ ...form, location_visited: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Family Members Present"
          value={form.family_members_present}
          onChange={(e) => setForm({ ...form, family_members_present: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Purpose of Visit"
          value={form.purpose}
          onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Observations"
          value={form.observations}
          onChange={(e) => setForm({ ...form, observations: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Family Cooperation Level"
          value={form.family_cooperation_level}
          onChange={(e) => setForm({ ...form, family_cooperation_level: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Safety Concerns Noted"
          value={form.safety_concerns_noted}
          onChange={(e) => setForm({ ...form, safety_concerns_noted: e.target.value })}
          className="border p-2 w-full"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.follow_up_needed}
            onChange={(e) =>
              setForm({ ...form, follow_up_needed: e.target.checked })
            }
          />
          Follow-up Needed
        </label>

        <textarea
          placeholder="Follow-Up Notes"
          value={form.follow_up_notes}
          onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })}
          className="border p-2 w-full"
        />

        <textarea
          placeholder="Visit Outcome"
          value={form.visit_outcome}
          onChange={(e) => setForm({ ...form, visit_outcome: e.target.value })}
          className="border p-2 w-full"
        />

        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Visit
        </button>
      </form>

      {/* VISIT HISTORY */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Visit History</h2>

        {filteredVisits.map(v => (
          <div key={v.id} className="border p-4 mb-3 rounded shadow-sm">
            <div className="flex justify-between">
              <strong>{v.visit_date}</strong>
              <span>{v.visit_type}</span>
            </div>

            <p><strong>Worker:</strong> {v.social_worker}</p>
            <p><strong>Location:</strong> {v.location_visited}</p>
            <p><strong>Family Present:</strong> {v.family_members_present}</p>
            <p><strong>Purpose:</strong> {v.purpose}</p>
            <p><strong>Observations:</strong> {v.observations}</p>
            <p><strong>Cooperation:</strong> {v.family_cooperation_level}</p>
            <p><strong>Safety:</strong> {v.safety_concerns_noted}</p>
            <p><strong>Outcome:</strong> {v.visit_outcome}</p>

            {v.follow_up_needed && (
              <p className="text-sm text-orange-600 mt-2">
                Follow-up: {v.follow_up_notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* CASE CONFERENCES */}
      <div>
        <h2 className="font-semibold mb-3">Upcoming Conferences</h2>
        {upcoming.map(c => (
          <div key={c.id} className="border p-3 mb-2 rounded bg-yellow-50">
            <p><strong>{c.case_conference_date}</strong></p>
            <p>{c.plan_description}</p>
          </div>
        ))}

        <h2 className="font-semibold mt-6 mb-3">Conference History</h2>
        {history.map(c => (
          <div key={c.id} className="border p-3 mb-2 rounded bg-gray-50">
            <p><strong>{c.case_conference_date}</strong></p>
            <p>{c.plan_description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}