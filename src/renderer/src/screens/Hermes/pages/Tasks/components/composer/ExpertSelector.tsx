import { MOCK_EXPERTS } from "../../../../mock/mockExperts";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function ExpertSelector({ value, onChange, disabled }: Props) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="hermes-composer-expert-selector">
      {MOCK_EXPERTS.map((expert) => (
        <button
          key={expert.id}
          type="button"
          className={`hermes-task-chip${value.includes(expert.id) ? " is-active" : ""}`}
          disabled={disabled}
          onClick={() => toggle(expert.id)}
        >
          {expert.displayName}
        </button>
      ))}
    </div>
  );
}
