const MOCK_SKILLS = [
  { id: "crm-research", name: "CRM 客户研究" },
  { id: "competitive-scan", name: "竞情扫描" },
  { id: "pipeline-review", name: "Pipeline 评审" },
  { id: "call-prep", name: "通话准备" },
] as const;

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export function SkillSelector({ value, onChange, disabled }: Props) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <div className="hermes-composer-skill-selector">
      {MOCK_SKILLS.map((skill) => (
        <button
          key={skill.id}
          type="button"
          className={`hermes-task-chip${value.includes(skill.id) ? " is-active" : ""}`}
          disabled={disabled}
          onClick={() => toggle(skill.id)}
        >
          {skill.name}
        </button>
      ))}
    </div>
  );
}
