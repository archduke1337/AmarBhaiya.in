export type CourseCatalogItem = {
  slug: string;
  title: string;
  shortDescription: string;
  category: "tech" | "academics" | "fitness" | "career";
  level: string;
  priceInr: number;
  rating: number;
  totalLessons: number;
  enrolledStudents: number;
  totalDurationHours: number;
  updatedAt: string;
  whatYouLearn: string[];
  requirements: string[];
  curriculum: Array<{
    title: string;
    lessons: string[];
  }>;
};

export const COURSE_CATALOG: CourseCatalogItem[] = [
  {
    slug: "complete-coding-bootcamp",
    title: "Complete Coding Bootcamp",
    shortDescription:
      "From HTML and CSS to React and backend fundamentals with project-first learning.",
    category: "tech",
    level: "Class 9+",
    priceInr: 0,
    rating: 4.8,
    totalLessons: 42,
    enrolledStudents: 1240,
    totalDurationHours: 38,
    updatedAt: "2026-03-10",
    whatYouLearn: [
      "Build responsive websites with HTML, CSS, and JavaScript",
      "Understand React components, state, and routing",
      "Ship portfolio-ready full-stack projects",
    ],
    requirements: [
      "No prior coding experience required",
      "Laptop with stable internet",
      "Willingness to practice daily",
    ],
    curriculum: [
      {
        title: "Web Foundations",
        lessons: [
          "HTML semantics and page structure",
          "CSS layouts, Flexbox, and Grid",
          "JavaScript basics and DOM events",
        ],
      },
      {
        title: "React and Modern Frontend",
        lessons: [
          "Components and props",
          "State, effects, and data flow",
          "Routing and page architecture",
        ],
      },
      {
        title: "Projects and Deployment",
        lessons: [
          "Build a portfolio project",
          "API integration and auth basics",
          "Deploy to production",
        ],
      },
    ],
  },
  {
    slug: "board-exam-domination",
    title: "Board Exam Domination",
    shortDescription:
      "A practical strategy system for Class 10 and 12 board preparation with PYQ-first revision.",
    category: "academics",
    level: "Class 10 and 12",
    priceInr: 499,
    rating: 4.7,
    totalLessons: 27,
    enrolledStudents: 680,
    totalDurationHours: 24,
    updatedAt: "2026-03-21",
    whatYouLearn: [
      "Create a realistic revision system around PYQs",
      "Use chapter-priority strategy to avoid burnout",
      "Write higher-scoring answers under time pressure",
    ],
    requirements: [
      "School syllabus books",
      "Last 5 years PYQ papers",
      "One dedicated notebook for active recall",
    ],
    curriculum: [
      {
        title: "Exam Strategy",
        lessons: [
          "Syllabus mapping and chapter weighting",
          "Daily and weekly revision loops",
          "Error log method",
        ],
      },
      {
        title: "Execution",
        lessons: [
          "How to solve PYQs intelligently",
          "Time-boxed mock routines",
          "Last 15-day sprint plan",
        ],
      },
    ],
  },
  {
    slug: "student-fitness-blueprint",
    title: "Student Fitness Blueprint",
    shortDescription:
      "Simple routines for students: posture, energy, nutrition, and consistency without expensive equipment.",
    category: "fitness",
    level: "All levels",
    priceInr: 0,
    rating: 4.9,
    totalLessons: 18,
    enrolledStudents: 520,
    totalDurationHours: 12,
    updatedAt: "2026-02-14",
    whatYouLearn: [
      "Create a student-friendly workout routine",
      "Build basic nutrition habits on a budget",
      "Improve focus and sleep through movement",
    ],
    requirements: [
      "No gym membership required",
      "A 6x4 foot workout space",
      "Consistency over intensity mindset",
    ],
    curriculum: [
      {
        title: "Movement Basics",
        lessons: [
          "Warm-up and mobility",
          "Bodyweight strength plan",
          "Weekly progression model",
        ],
      },
      {
        title: "Lifestyle",
        lessons: [
          "Meal structure for students",
          "Sleep and recovery",
          "Tracking and consistency hacks",
        ],
      },
    ],
  },
  {
    slug: "career-launchpad",
    title: "Career Launchpad",
    shortDescription:
      "Stream, college, and placement decision framework with practical communication and interview prep.",
    category: "career",
    level: "Class 11+",
    priceInr: 799,
    rating: 4.6,
    totalLessons: 21,
    enrolledStudents: 390,
    totalDurationHours: 16,
    updatedAt: "2026-03-03",
    whatYouLearn: [
      "Make better stream and career decisions",
      "Build resume and portfolio fundamentals",
      "Communicate with confidence in interviews",
    ],
    requirements: [
      "Basic self-assessment notes",
      "Willingness to practice speaking tasks",
      "Access to job/internship portals",
    ],
    curriculum: [
      {
        title: "Decision Framework",
        lessons: [
          "Interest versus opportunity matrix",
          "Career path mapping",
          "Choosing projects strategically",
        ],
      },
      {
        title: "Placement Prep",
        lessons: [
          "Resume and profile building",
          "Interview communication",
          "Mock interview drills",
        ],
      },
    ],
  },
];

export function getCourseBySlug(slug: string): CourseCatalogItem | undefined {
  return COURSE_CATALOG.find((course) => course.slug === slug);
}

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: "learning" | "productivity" | "career";
  publishedAt: string;
  readMinutes: number;
  content: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-study-like-an-operator",
    title: "How To Study Like An Operator",
    excerpt:
      "Most students consume content. Operators build systems. Here is a practical model to switch your study style.",
    category: "learning",
    publishedAt: "2026-03-12",
    readMinutes: 6,
    content: [
      "A lot of students confuse effort with output. They watch, highlight, and feel productive, but there is no measurable execution loop.",
      "An operator mindset starts with weekly outcomes. Pick one outcome per week: a chapter solved, a project module shipped, or a mock test score improved.",
      "Then design a repeatable cycle: learn, apply, review, and improve. If your day has no review block, your system is incomplete.",
      "If you can measure it, you can improve it. Track attempts, not motivation.",
    ],
  },
  {
    slug: "zero-to-first-freelance-project",
    title: "Zero To First Freelance Project",
    excerpt:
      "You do not need a big audience to start freelancing. You need one sharp offer and proof of execution.",
    category: "career",
    publishedAt: "2026-02-26",
    readMinutes: 7,
    content: [
      "Start with a narrow skill and a narrow market. Generalists struggle to get the first client.",
      "Create one demo project with clear before and after outcomes. That becomes your trust asset.",
      "Outreach should be short and specific. Show what you can fix in their current setup.",
      "Your first project is not about money. It is about proof, testimonial, and momentum.",
    ],
  },
  {
    slug: "fitness-for-exam-month",
    title: "Fitness Plan For Exam Month",
    excerpt:
      "Exam pressure does not mean you stop moving. It means you simplify movement so your focus stays sharp.",
    category: "productivity",
    publishedAt: "2026-01-19",
    readMinutes: 5,
    content: [
      "During exam month, your goal is stability, not intensity. A 20-minute daily routine beats random long sessions.",
      "Use a simple split: mobility, push-pull-legs bodyweight, and short walks after meals.",
      "Nutrition should reduce decision fatigue. Keep two standard meals and one high-protein snack template.",
      "Sleep is the highest ROI study booster. Protect it aggressively.",
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
