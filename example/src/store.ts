import { GetParams, PostResult } from '../../dist'

export type Product = {
  id: number
  sku: string
  name: string
  price: number
  stock: boolean
}

const data: Product[] = [
  { id: 1, sku: 'sku001', name: 'Australian Apple', price: 5, stock: true },
  { id: 2, sku: 'sku002', name: 'Australian Banana', price: 6, stock: true },
  { id: 3, sku: 'sku003', name: 'American Apple', price: 7, stock: true },
  { id: 4, sku: 'sku004', name: 'American Banana', price: 8, stock: false },
  { id: 5, sku: 'sku005', name: 'Australian Beef', price: 15, stock: true },
  { id: 6, sku: 'sku006', name: 'Australian Lamb', price: 16, stock: true },
  { id: 7, sku: 'sku007', name: 'American Beef', price: 17, stock: true },
  { id: 8, sku: 'sku008', name: 'American Lamb', price: 18, stock: true }
]

export const create = (row: Product): Promise<PostResult<Product>> => {
  data.push(row)
  return Promise.resolve({ data: row })
}

export const list = (
  args: GetParams
): Promise<{
  rows: Product[]
  count: number
}> => {
  const { pageSize, pageNumber, search, orderBy } = args

  let result = [...data]

  if (search) {
    result = result.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (orderBy && result.length > 0) {
    let key = orderBy
    let dir = 1
    if (/^-/.test(key)) {
      key = key.substring(1)
      dir = -1
    }
    const isNumber = typeof result[0][key] === 'number'
    result.sort((a, b) =>
      isNumber ? dir * (a[key] - b[key]) : dir * a[key].localeCompare(b[key])
    )
  }

  result = result.splice((pageNumber - 1) * pageSize, pageSize)

  return Promise.resolve({ rows: result, count: data.length })
}

export const update = (row: Product): Promise<PostResult<Product>> => {
  const index = data.findIndex((p) => p.id === row.id)
  if (index === -1) {
    data.push(row)
  } else {
    data[index] = row
  }
  return Promise.resolve({ data: row })
}

export const remove = (row: Product): Promise<PostResult<Product>> => {
  const index = data.findIndex((p) => p.id === row.id)
  if (index > -1) {
    data.splice(index, 1)
  }
  return Promise.resolve({ data: row })
}
