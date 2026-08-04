import { CATEGORIES, CATEGORY_INFO, type Category } from '../game/types';

interface Props {
  selected: Category | null;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({ selected, onSelect }: Props) {
  return (
    <div className="category-grid">
      {CATEGORIES.map((category) => {
        const info = CATEGORY_INFO[category];
        return (
          <button
            key={category}
            type="button"
            className={`category-tile cat-${category.toLowerCase()}`}
            aria-pressed={selected === category}
            onClick={() => onSelect(category)}
          >
            <span className="cat-short">{info.short}</span>
            <span className="cat-name">{info.label}</span>
            <span className="cat-desc">{info.description}</span>
          </button>
        );
      })}
    </div>
  );
}
