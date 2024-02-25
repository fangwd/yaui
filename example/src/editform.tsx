import React, { useEffect, useState } from 'react'
import { Product } from './store'

const EMPTY: Product = {
  id: 0,
  sku: '',
  name: '',
  price: 0,
  stock: false
}

export default function EditForm({
  data,
  handleClose,
  handleSave
}: {
  data?: Product
  handleClose: () => void
  handleSave: (data: Product) => void
  error?: string
  fieldErrors: { [key: string]: string }
}) {
  const [product, setProduct] = useState<Product>(data || EMPTY)

  useEffect(() => {
    setProduct(data || EMPTY)
  }, [data])

  const handleChange = (
    name: keyof Product,
    value: string | number | boolean
  ) => {
    setProduct({ ...product, [name]: value })
  }

  return (
    <div>
      <div>
        ID:{' '}
        <input
          value={product.id}
          type='number'
          onChange={(e) => handleChange('id', e.target.value)}
        />
      </div>
      <div>
        SKU:{' '}
        <input
          value={product.sku}
          onChange={(e) => handleChange('sku', e.target.value)}
        />
      </div>
      <div>
        Name:{' '}
        <input
          value={product.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>
      <div>
        Price:{' '}
        <input
          value={product.price}
          type='number'
          onChange={(e) => handleChange('price', e.target.value)}
        />
      </div>

      <div>
        <button onClick={() => handleClose()}>Cancel</button>
        <button onClick={() => handleSave(product)}>Save</button>
      </div>
    </div>
  )
}
