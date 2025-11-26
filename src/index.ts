import { SQL, and, eq, gte, lte, between, gt, lt, ilike } from 'drizzle-orm'
import { getTableColumns } from 'drizzle-orm'
import { z } from 'zod'

type ColumnType = 'string' | 'number' | 'date' | 'boolean'

function getColumnType(column: any): ColumnType {
    const sqlType = column.getSQLType().toLowerCase()
    const dataType = column.dataType

    if (dataType === 'number' || sqlType.includes('int') || sqlType.includes('numeric') || sqlType.includes('decimal')) return 'number'
    if (dataType === 'date' || sqlType.includes('timestamp') || sqlType.includes('date')) return 'date'
    if (dataType === 'boolean' || sqlType.includes('boolean')) return 'boolean'
    return 'string'
}

// Generate Zod schema with custom filters
export function generateFilterSchema<T>(
    table: any,
    filtersMap: Record<string, string[]>
) {
    const columns = getTableColumns(table)
    const schemaObj: Record<string, any> = {}

    Object.entries(columns).forEach(([name, column]) => {
        const type = getColumnType(column)
        const filters = filtersMap[name] || []

        filters.forEach((f) => {
            switch (type) {
                case 'string':
                    if (f === 'contains') schemaObj[`${name}_contains`] = z.string().optional()
                    if (f === 'eq') schemaObj[`${name}_equals`] = z.string().optional()
                    if (f === 'starts_with') schemaObj[`${name}_starts_with`] = z.string().optional()
                    if (f === 'ends_with') schemaObj[`${name}_ends_with`] = z.string().optional()
                    break
                case 'number':
                    if (f === 'eq') schemaObj[`${name}_equals`] = z.coerce.number().optional()
                    if (f === 'gt') schemaObj[`${name}_gt`] = z.coerce.number().optional()
                    if (f === 'gte') schemaObj[`${name}_gte`] = z.coerce.number().optional()
                    if (f === 'lt') schemaObj[`${name}_lt`] = z.coerce.number().optional()
                    if (f === 'lte') schemaObj[`${name}_lte`] = z.coerce.number().optional()
                    if (f === 'between') {
                        schemaObj[`${name}_between_min`] = z.coerce.number().optional()
                        schemaObj[`${name}_between_max`] = z.coerce.number().optional()
                    }
                    break
                case 'date':
                    if (f === 'eq') schemaObj[`${name}_equals`] = z.string().optional()
                    if (f === 'gte') schemaObj[`${name}_gte`] = z.string().optional()
                    if (f === 'lte') schemaObj[`${name}_lte`] = z.string().optional()
                    if (f === 'between') {
                        schemaObj[`${name}_between_start`] = z.string().optional()
                        schemaObj[`${name}_between_end`] = z.string().optional()
                    }
                    break
                case 'boolean':
                    if (f === 'eq') schemaObj[`${name}_equals`] = z.coerce.boolean().optional()
                    break
            }
        })
    })

    return z.object(schemaObj)
}

export function buildFilters<T>(
    table: any,
    queryParams: Record<string, any>,
    filtersMap: Record<string, string[]>
): SQL[] {
    const columns = getTableColumns(table)
    const conditions: SQL[] = []

    Object.entries(columns).forEach(([name, column] : any) => {
        const type = getColumnType(column)
        const filters = filtersMap[name] || []

        filters.forEach((f) => {
            switch (type) {
                case 'string':
                    if (f === 'contains' && queryParams[`${name}_contains`]) conditions.push(ilike(column, `%${queryParams[`${name}_contains`]}%`))
                    if (f === 'eq' && queryParams[`${name}_equals`]) conditions.push(eq(column, queryParams[`${name}_equals`]))
                    if (f === 'starts_with' && queryParams[`${name}_starts_with`]) conditions.push(ilike(column, `${queryParams[`${name}_starts_with`]}%`))
                    if (f === 'ends_with' && queryParams[`${name}_ends_with`]) conditions.push(ilike(column, `%${queryParams[`${name}_ends_with`]}`))
                    break
                case 'number':
                    if (f === 'eq' && queryParams[`${name}_equals`] !== undefined) conditions.push(eq(column, queryParams[`${name}_equals`]))
                    if (f === 'gt' && queryParams[`${name}_gt`] !== undefined) conditions.push(gt(column, queryParams[`${name}_gt`]))
                    if (f === 'gte' && queryParams[`${name}_gte`] !== undefined) conditions.push(gte(column, queryParams[`${name}_gte`]))
                    if (f === 'lt' && queryParams[`${name}_lt`] !== undefined) conditions.push(lt(column, queryParams[`${name}_lt`]))
                    if (f === 'lte' && queryParams[`${name}_lte`] !== undefined) conditions.push(lte(column, queryParams[`${name}_lte`]))
                    if (f === 'between' &&
                        queryParams[`${name}_between_min`] !== undefined &&
                        queryParams[`${name}_between_max`] !== undefined
                    ) conditions.push(between(column, queryParams[`${name}_between_min`], queryParams[`${name}_between_max`]))
                    break
                case 'date':
                    if (f === 'eq' && queryParams[`${name}_equals`]) {
                        conditions.push(eq(column, new Date(queryParams[`${name}_equals`])))
                    }
                    if (f === 'gte' && queryParams[`${name}_gte`]) {
                        
                        conditions.push(gte(column, new Date(queryParams[`${name}_gte`])))
                    }
                    if (f === 'lte' && queryParams[`${name}_lte`]) {
                        conditions.push(lte(column, new Date(queryParams[`${name}_lte`])))
                    }
                    if (f === 'between' &&
                        queryParams[`${name}_between_start`] &&
                        queryParams[`${name}_between_end`]
                    ) {
                        conditions.push(
                            between(
                                column,
                                new Date(queryParams[`${name}_between_start`]),
                                new Date(queryParams[`${name}_between_end`])
                            )
                        )
                    }
                    break

                case 'boolean':
                    if (f === 'eq' && queryParams[`${name}_equals`] !== undefined) conditions.push(eq(column, queryParams[`${name}_equals`]))
                    break
            }
        })
    })

    return conditions
}

export function applyFilters<T>(
    table: T,
    queryParams: Record<string, any>,
    filtersMap: Record<string, string[]>
): SQL | undefined {
    const filters = buildFilters(table, queryParams, filtersMap)
    
    return filters.length > 0 ? and(...filters) : undefined
}
