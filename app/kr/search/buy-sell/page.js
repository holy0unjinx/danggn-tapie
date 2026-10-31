import { redirect } from 'next/navigation';

export default async function LegacySearchPage({ searchParams }) {
  const params = await searchParams;
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) => {
      if (Array.isArray(value)) return value.map((item) => [key, item]);
      if (value == null) return [];
      return [[key, value]];
    })
  ).toString();
  redirect(query ? `/?${query}` : '/');
}
