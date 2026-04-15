import { TYPE_LABELS, ELEMENT_TYPES } from '../../constants/elementTypes';

interface TypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {ELEMENT_TYPES.map((type) => (
        <option key={type} value={type}>
          {TYPE_LABELS[type]}
        </option>
      ))}
    </select>
  );
}
