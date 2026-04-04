export function formatAdminUserOption(user: {
  name: string;
  email: string;
  role?: string;
}): string {
  const parts = [user.name, user.email];
  if (user.role) {
    parts.push(user.role);
  }

  return parts.filter((part) => part && part.trim().length > 0).join(" · ");
}

export function formatAdminCourseOption(course: {
  title: string;
  category: string;
  state: string;
}): string {
  return [course.title, course.category, course.state]
    .filter((part) => part && part.trim().length > 0)
    .join(" · ");
}
