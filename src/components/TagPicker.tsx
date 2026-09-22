import { useState } from "react";
import { tags } from "../domain/stories";
export function TagPicker({
  label,
  value,
  options,
  separator,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  separator: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const selected = tags(value, separator);
  const toggle = (tag: string) =>
    onChange(
      (selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
      ).join(separator + " "),
    );
  return (
    <div className="story-tag-picker" role="group" aria-label={label}>
      <div className="story-tags">
        {[...new Set([...options, ...selected])].map((tag) => (
          <button
            type="button"
            key={tag}
            aria-pressed={selected.includes(tag)}
            disabled={disabled}
            className={selected.includes(tag) ? "selected" : ""}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <div className="button-group">
        <input
          aria-label={"Custom " + label}
          value={custom}
          disabled={disabled}
          placeholder="Add a custom tag…"
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        <button
          type="button"
          disabled={disabled || !custom.trim() || custom.includes(separator)}
          onClick={() => {
            const tag = custom.trim();
            if (!selected.includes(tag)) toggle(tag);
            setCustom("");
          }}
        >
          Add tag
        </button>
      </div>
    </div>
  );
}
