import { ClassroomWidget } from "@/components/widgets/classroom";

export default function ClassroomPage() {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Google Classroom
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your classes, assignments, and announcements.
        </p>
      </div>
      <div className="flex-1">
        <ClassroomWidget />
      </div>
    </div>
  );
}
