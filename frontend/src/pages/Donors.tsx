import React from "react";

type DonationRecord = {
  supporter_id: number;
  display_name: string;
  organization_name?: string;
  first_name?: string;
  last_name?: string;

  donation_id: number;
  donation_type: string;
  donation_date: string;
  currency_code: string;
  amount: number;
  estimated_value?: number;
  impact_unit?: string;
  is_recurring: boolean;
  campaign_name?: string;
};

export default function DonorDashboard() {
  // 🔹 Mock JOINED data
  const data: DonationRecord[] = [
    {
      supporter_id: 1,
      display_name: "Sarah Peck",
      first_name: "Sarah",
      last_name: "Peck",
      donation_id: 101,
      donation_type: "Online",
      donation_date: "2026-01-15",
      currency_code: "USD",
      amount: 100,
      estimated_value: 100,
      impact_unit: "Meals",
      is_recurring: false,
      campaign_name: "Winter Relief"
    },
    {
      supporter_id: 1,
      display_name: "Sarah Peck",
      first_name: "Sarah",
      last_name: "Peck",
      donation_id: 102,
      donation_type: "Recurring",
      donation_date: "2026-02-15",
      currency_code: "USD",
      amount: 50,
      estimated_value: 50,
      impact_unit: "Shelter Nights",
      is_recurring: true,
      campaign_name: "Monthly Giving"
    }
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Donor Contributions</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={th}>Donor</th>
            <th style={th}>Donation ID</th>
            <th style={th}>Type</th>
            <th style={th}>Date</th>
            <th style={th}>Amount</th>
            <th style={th}>Recurring</th>
            <th style={th}>Campaign</th>
            <th style={th}>Impact</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.donation_id}>
              <td style={td}>{row.display_name}</td>
              <td style={td}>{row.donation_id}</td>
              <td style={td}>{row.donation_type}</td>
              <td style={td}>{row.donation_date}</td>
              <td style={td}>
                {row.currency_code} {row.amount}
              </td>
              <td style={td}>{row.is_recurring ? "Yes" : "No"}</td>
              <td style={td}>{row.campaign_name}</td>
              <td style={td}>{row.impact_unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  padding: "10px",
  borderBottom: "2px solid #ddd",
  textAlign: "left" as const
};

const td = {
  padding: "10px",
  borderBottom: "1px solid #ddd"
};