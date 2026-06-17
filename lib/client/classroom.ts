/**
 * Google Classroom API client.
 *
 * This module attempts to fetch coursework from Google Classroom using
 * an OAuth access token obtained during sign-in (with the
 * classroom.coursework.me.readonly scope).
 *
 * If the token is missing or the API returns an auth error, it falls back to
 * stub data so the UI always renders something useful.
 *
 * IMPORTANT: For this to work in production:
 * 1. Enable the Google Classroom API in your GCP project
 *    (APIs & Services → Library → Google Classroom API → Enable)
 * 2. Add "https://www.googleapis.com/auth/classroom.coursework.me.readonly"
 *    to the OAuth consent screen scopes
 * 3. Ensure the OAuth client ID is a Web client (not Desktop)
 *
 * Without these steps, the Classroom API will return 403/401 and the widget
 * will display stub data with a configuration hint.
 */

export interface ClassroomAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO date string
  courseName: string;
  submitted: boolean;
  url: string | null;
}

const STUB_ASSIGNMENTS: ClassroomAssignment[] = [
  {
    id: "stub-1",
    title: "Thesis Proposal Draft",
    description:
      "Submit the final draft of your CS thesis proposal including abstract, methodology, and timeline.",
    dueDate: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    courseName: "CS 199 — Thesis Writing",
    submitted: false,
    url: null,
  },
  {
    id: "stub-2",
    title: "Machine Learning Quiz 4",
    description: "Covers neural networks and backpropagation.",
    dueDate: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    courseName: "CS 152 — Machine Learning",
    submitted: false,
    url: null,
  },
  {
    id: "stub-3",
    title: "Software Engineering — Sprint Review",
    description: "Record a 5-min Loom video walking through your sprint deliverables.",
    dueDate: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    courseName: "CS 145 — Software Engineering",
    submitted: false,
    url: null,
  },
  {
    id: "stub-4",
    title: "Data Structures — Problem Set 7",
    description: "Graph algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall).",
    dueDate: new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    courseName: "CS 120 — Data Structures",
    submitted: true,
    url: null,
  },
];

const CLASSROOM_API_BASE = "https://classroom.googleapis.com/v1";

/**
 * Fetch the list of courses the user is enrolled in.
 */
async function fetchCourses(
  accessToken: string,
): Promise<Array<{ id: string; name: string }>> {
  const res = await fetch(`${CLASSROOM_API_BASE}/courses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Classroom API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.courses ?? []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));
}

/**
 * Fetch coursework (assignments) for a given course.
 */
async function fetchCoursework(
  accessToken: string,
  courseId: string,
): Promise<
  Array<{
    id: string;
    title: string;
    description: string;
    dueDate: { year: number; month: number; day: number } | null;
    alternateLink: string;
  }>
> {
  const res = await fetch(
    `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    throw new Error(`Classroom API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.courseWork ?? []).map(
    (cw: {
      id: string;
      title: string;
      description?: string;
      dueDate?: { year: number; month: number; day: number };
      alternateLink?: string;
    }) => ({
      id: cw.id,
      title: cw.title,
      description: cw.description ?? "",
      dueDate: cw.dueDate ?? null,
      alternateLink: cw.alternateLink ?? null,
    }),
  );
}

/**
 * Fetch student submissions for a given course ID and coursework ID.
 * Returns a set of coursework IDs that have been turned in.
 */
async function fetchStudentSubmissions(
  accessToken: string,
  courseId: string,
  courseworkId: string,
): Promise<boolean> {
  const res = await fetch(
    `${CLASSROOM_API_BASE}/courses/${courseId}/courseWork/${courseworkId}/studentSubmissions`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  const submissions = data.studentSubmissions ?? [];
  return submissions.some(
    (s: { state: string }) => s.state === "TURNED_IN" || s.state === "RETURNED",
  );
}

export async function fetchClassroomAssignments(
  accessToken: string | null,
): Promise<{
  assignments: ClassroomAssignment[];
  configured: boolean;
  error: string | null;
}> {
  if (!accessToken) {
    return {
      assignments: STUB_ASSIGNMENTS,
      configured: false,
      error: "Sign in with Google to sync your Classroom assignments.",
    };
  }

  try {
    const courses = await fetchCourses(accessToken);

    if (courses.length === 0) {
      return {
        assignments: [],
        configured: true,
        error: null,
      };
    }

    // Fetch coursework for all courses in parallel
    const courseworkResults = await Promise.allSettled(
      courses.map(async (course) => {
        const coursework = await fetchCoursework(accessToken, course.id);
        return coursework.map((cw) => ({ ...cw, courseName: course.name }));
      }),
    );

    const allCoursework: Array<{
      id: string;
      title: string;
      description: string;
      dueDate: { year: number; month: number; day: number } | null;
      alternateLink: string;
      courseName: string;
    }> = [];
    for (const result of courseworkResults) {
      if (result.status === "fulfilled") {
        for (const item of result.value) {
          allCoursework.push(item);
        }
      }
    }

    // Check submission status for each coursework in parallel
    const submissionResults = await Promise.allSettled(
      allCoursework.map(async (cw) => {
        const submitted = await fetchStudentSubmissions(
          accessToken,
          courses.find((c) => c.name === cw.courseName)?.id ?? "",
          cw.id,
        );
        return { courseworkId: cw.id, submitted };
      }),
    );

    const submittedMap = new Map<string, boolean>();
    for (const result of submissionResults) {
      if (result.status === "fulfilled") {
        submittedMap.set(result.value.courseworkId, result.value.submitted);
      }
    }

    const assignments: ClassroomAssignment[] = allCoursework.map((cw) => ({
      id: cw.id,
      title: cw.title,
      description: cw.description,
      dueDate: cw.dueDate
        ? new Date(
            cw.dueDate.year,
            cw.dueDate.month - 1,
            cw.dueDate.day,
          ).toISOString()
        : null,
      courseName: cw.courseName,
      submitted: submittedMap.get(cw.id) ?? false,
      url: cw.alternateLink,
    }));

    // Sort by due date ascending, unsubmitted first
    assignments.sort((a, b) => {
      if (a.submitted !== b.submitted) return a.submitted ? 1 : -1;
      if (!a.dueDate || !b.dueDate) return a.dueDate ? -1 : 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return { assignments, configured: true, error: null };
  } catch (err) {
    // If Classroom API fails (e.g. not enabled in GCP), return stubs with hint
    return {
      assignments: STUB_ASSIGNMENTS,
      configured: false,
      error:
        "Classroom API not configured. Enable it in GCP Console → APIs & Services → Library → Google Classroom API.",
    };
  }
}
