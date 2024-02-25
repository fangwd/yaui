import React from 'react'

import { DataTable } from 'yaui'
import 'yaui/dist/index.css'

import { list, create, update, remove } from './store'

import EditForm from './editform'

const config = {
  columns: [
    { title: 'Id', field: 'id', sortable: true },
    { title: 'Sku', field: 'sku', sortable: false },
    { title: 'Name', field: 'name', sortable: false },
    { title: 'Price', field: 'price', sortable: true },
    { title: 'Stock', field: 'stock', sortable: false }
  ],
  EditForm,
  pageSize: 5,
  create,
  list,
  update,
  delete: remove,
  searchable: true
}

const App = () => <DataTable {...config} />

export default App
