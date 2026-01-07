import type { WithContext, Thing } from 'schema-dts'

type SchemaOrgProps<T extends Thing> = {
  schema: WithContext<T>
}

export function SchemaOrg<T extends Thing>({ schema }: SchemaOrgProps<T>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
