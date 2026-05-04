type BuildPageHrefOptions = {
  page: number;
  districtIds: number[];
};

export function buildPageHref({ page, districtIds }: BuildPageHrefOptions) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("page", String(page));
  }

  if (districtIds.length > 0) {
    params.set("districts", districtIds.join(","));
  }

  const query = params.toString();
  return query.length > 0 ? `/?${query}` : "/";
}
