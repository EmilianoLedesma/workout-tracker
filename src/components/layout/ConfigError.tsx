export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="page-title">Configuration missing</h1>
      <p className="mt-2">
        Set these environment variables (see <code>.env.example</code>):
      </p>
      <ul className="mt-2 list-disc pl-6">
        {missing.map((name) => (
          <li key={name}>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
