/**
 * Turns "Machine Learning Intern" into "machine-learning-intern-a1b2c3".
 * The random suffix keeps slugs unique even if two internships share a title.
 */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const suffix = Math.random().toString(36).slice(2, 8);

  return `${base || "internship"}-${suffix}`;
}
