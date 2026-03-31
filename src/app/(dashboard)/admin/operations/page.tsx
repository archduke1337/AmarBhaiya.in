import {
  createCategoryAction,
  updateCourseVisibilityAction,
  updateUserRoleAction,
} from "@/actions/operations";
import {
  getAdminCategories,
  getAdminCourses,
  getAdminUsers,
} from "@/lib/appwrite/dashboard-data";

const roleOptions = ["admin", "instructor", "moderator", "student"] as const;

export default async function AdminOperationsPage() {
  const [users, courses, categories] = await Promise.all([
    getAdminUsers(),
    getAdminCourses(),
    getAdminCategories(),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin Operations</p>
        <h1 className="text-3xl md:text-4xl">Platform Operations Console</h1>
        <p className="text-muted-foreground max-w-3xl">
          Centralized controls for role access, course publishing, and category lifecycle management.
        </p>
      </section>

      <section className="grid xl:grid-cols-2 gap-5">
        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Role assignment</h2>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users available for role updates.</p>
          ) : (
            <form action={updateUserRoleAction} className="space-y-3">
              <select
                name="userId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={users[0]?.id ?? ""}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <select
                name="role"
                className="w-full h-11 border border-border bg-background px-3"
                defaultValue="student"
                required
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Update role
              </button>
            </form>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Recent users</p>
            {users.slice(0, 6).map((user) => (
              <p key={user.id} className="text-sm text-muted-foreground">
                {user.name} - {user.role}
              </p>
            ))}
          </div>
        </article>

        <article className="border border-border p-6 space-y-4">
          <h2 className="text-xl">Course visibility controls</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses available for visibility updates.</p>
          ) : (
            <form action={updateCourseVisibilityAction} className="space-y-3">
              <select
                name="courseId"
                className="w-full h-11 border border-border bg-background px-3"
                required
                defaultValue={courses[0]?.id ?? ""}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Published</span>
                  <select
                    name="isPublished"
                    className="w-full h-11 border border-border bg-background px-3"
                    defaultValue="false"
                  >
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Featured</span>
                  <select
                    name="isFeatured"
                    className="w-full h-11 border border-border bg-background px-3"
                    defaultValue="false"
                  >
                    <option value="true">Featured</option>
                    <option value="false">Standard</option>
                  </select>
                </label>
              </div>
              <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
                Save visibility
              </button>
            </form>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Course states</p>
            {courses.slice(0, 6).map((course) => (
              <p key={course.id} className="text-sm text-muted-foreground">
                {course.title} - {course.state} - featured: {course.featured}
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="border border-border p-6 space-y-4 max-w-3xl">
        <h2 className="text-xl">Create category</h2>
        <form action={createCategoryAction} className="space-y-3">
          <input
            name="name"
            className="w-full h-11 border border-border bg-background px-3"
            placeholder="Category name"
            required
          />
          <input
            name="slug"
            className="w-full h-11 border border-border bg-background px-3"
            placeholder="Slug (optional)"
          />
          <textarea
            name="description"
            className="w-full min-h-24 border border-border bg-background px-3 py-2"
            placeholder="Category description"
          />
          <input
            name="order"
            type="number"
            min={0}
            defaultValue={categories.length}
            className="w-full h-11 border border-border bg-background px-3"
          />
          <button type="submit" className="h-10 px-4 bg-foreground text-background text-sm">
            Add category
          </button>
        </form>
      </section>
    </div>
  );
}