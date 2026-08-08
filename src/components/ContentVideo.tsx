import { youtubeEmbedUrl } from "@/lib/video";

export function ContentVideo({
  videoUrl,
  videoTitle,
}: {
  videoUrl: string | null | undefined;
  videoTitle?: string | null;
}) {
  if (!videoUrl) return null;

  const embed = youtubeEmbedUrl(videoUrl);
  const title = videoTitle?.trim() || "Video del ejercicio";

  return (
    <div className="mt-5 space-y-2 border-t border-[var(--line)] pt-4">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      {embed ? (
        <div className="aspect-video overflow-hidden rounded-lg border border-[var(--line)] bg-black">
          <iframe
            src={embed}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-semibold underline"
        >
          Abrir video →
        </a>
      )}
    </div>
  );
}
