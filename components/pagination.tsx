import Link from "next/link";
import { buildPageHref } from "@/lib/url";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  selectedDistrictIds: number[];
};

export function Pagination({
  currentPage,
  totalPages,
  selectedDistrictIds
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination-bar" aria-label="Constituency results pagination">
      <div>
        <strong>Pagination</strong>
        <p className="meta-copy">Showing 50 constituencies per page.</p>
      </div>
      <div className="pagination-pages">
        {pages.map((page) => (
          <Link
            key={page}
            className={`page-link${page === currentPage ? " active" : ""}`}
            href={buildPageHref({ page, districtIds: selectedDistrictIds })}
          >
            {page}
          </Link>
        ))}
      </div>
    </nav>
  );
}
