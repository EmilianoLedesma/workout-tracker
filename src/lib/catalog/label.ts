/** "pull-up-bar" -> "Pull-up bar" */
export function label(value: string): string {
  const text = value.replace(/-/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
