import { useQuery } from '@tanstack/react-query'
import { label } from '@/lib/catalog/label'
import { loadCredits } from '@/lib/catalog/loadCredits'

export default function CreditsPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['credits'],
    queryFn: loadCredits,
    staleTime: Infinity,
  })

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Credits</h1>
      <p>
        This app records and organizes training. It is not medical advice and
        does not assess whether an exercise is safe for you.
      </p>

      {isPending && <p role="status">Loading credits…</p>}
      {isError && <p role="alert">Could not load credits.</p>}

      {data && (
        <>
          <section aria-labelledby="sources-heading" className="space-y-3">
            <h2 id="sources-heading" className="text-lg font-semibold">
              Sources and licenses
            </h2>
            <ul className="space-y-3">
              {data.sources.map((source) => (
                <li key={source.name}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    {source.name}
                  </a>
                  <p className="text-sm">{source.license}</p>
                  <p className="text-muted-foreground text-sm">{source.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <details>
            <summary className="min-h-11 cursor-pointer text-lg font-semibold">
              Illustration credits ({data.frames.length})
            </summary>
            <ul className="mt-2 space-y-2 text-sm">
              {data.frames.map((credit) => (
                <li key={credit.exerciseId}>
                  <span className="font-medium">
                    {label(credit.exerciseId.replace(/^wg-/, ''))}
                  </span>
                  : {credit.creator}, {credit.license}
                  {credit.sourceUrl && (
                    <>
                      {' '}
                      (derived from{' '}
                      <a
                        href={credit.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {credit.sourceUrl}
                      </a>
                      )
                    </>
                  )}
                  {credit.changes && <> {credit.changes}</>}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  )
}
