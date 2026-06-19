import { LinkStash } from "@/components/widgets/link-stash";

export default function LinksPage() {
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Links
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your saved bookmarks and resources.
        </p>
      </div>
      <div className="flex-1">
        <LinkStash />
      </div>
    </div>
  );
}
