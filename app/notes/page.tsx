import { NotesPage } from "@/components/notes/notes-page";

export default function NotesRoute() {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Notes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Write quick thoughts, save ideas, and keep track of what matters.
        </p>
      </div>
      <div className="flex-1">
        <NotesPage />
      </div>
    </div>
  );
}
