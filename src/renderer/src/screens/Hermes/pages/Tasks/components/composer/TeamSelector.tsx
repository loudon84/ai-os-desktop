import { MOCK_TEAMS } from "../../../../mock/mockTeams";

type Props = {
  value?: string;
  onChange: (teamId: string | undefined) => void;
  disabled?: boolean;
};

export function TeamSelector({ value, onChange, disabled }: Props) {
  return (
    <select
      className="hermes-composer-select"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      <option value="">—</option>
      {MOCK_TEAMS.map((team) => (
        <option key={team.id} value={team.id}>
          {team.displayName}
        </option>
      ))}
    </select>
  );
}
