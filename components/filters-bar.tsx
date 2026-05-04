import Link from "next/link";
import { buildPageHref } from "@/lib/url";

type District = {
  id: number;
  name: string;
};

type FiltersBarProps = {
  districts: District[];
  selectedDistrictIds: number[];
};

export function FiltersBar({ districts, selectedDistrictIds }: FiltersBarProps) {
  const allSelected = selectedDistrictIds.length === districts.length;

  return (
    <section className="filters-card">
      <div className="section-head">
        <div>
          <h2>District filters</h2>
          <p>All 38 districts are shown at the top. Use Select all or Clear all instantly.</p>
        </div>
        <div className="chip-actions">
          <Link
            className={`action-link${allSelected ? " active" : ""}`}
            href={buildPageHref({
              page: 1,
              districtIds: districts.map((district) => district.id)
            })}
          >
            Select all
          </Link>
          <Link
            className={`action-link${selectedDistrictIds.length === 0 ? " active" : ""}`}
            href={buildPageHref({ page: 1, districtIds: [] })}
          >
            Clear all
          </Link>
        </div>
      </div>

      <div className="district-grid">
        {districts.map((district) => {
          const isSelected = selectedDistrictIds.includes(district.id);
          const nextSelection = isSelected
            ? selectedDistrictIds.filter((id) => id !== district.id)
            : [...selectedDistrictIds, district.id].sort((left, right) => left - right);

          return (
            <Link
              key={district.id}
              className={`district-chip${isSelected ? " selected" : ""}`}
              href={buildPageHref({ page: 1, districtIds: nextSelection })}
            >
              {district.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
