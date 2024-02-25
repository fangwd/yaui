import React, {
  CSSProperties,
  FC,
  MouseEventHandler,
  useEffect,
  useRef,
  useState
} from 'react'
import styles from './styles.module.css'

export type Value = string | number | Date | null | undefined

export type Column<Row> = {
  // Column title (<th>)
  title: string

  // Field name (for sorting/key)
  field: string

  // Default true
  sortable?: boolean

  render?: (row: Row, column: Column<Row>) => React.ReactNode | Value

  style?: CSSProperties
}

export type EditForm<Row> = FC<{
  data?: Row
  handleClose: () => void
  handleSave: (row: Row) => void
  fieldErrors: { [key: string]: string }
  error?: string
}>

export type GetParams = {
  pageSize: number
  pageNumber: number
  search?: string
  orderBy?: string
  query?: { [key: string]: string }
}

export type DataTableProps<Row> = {
  columns: Column<Row>[]
  EditForm: EditForm<Row>
  pageSize: number
  create: (row: Row) => Promise<PostResult<Row>>
  list: (args: GetParams) => Promise<{ rows: Row[]; count: number }>
  update: (row: Row) => Promise<PostResult<Row>>
  delete: (row: Row) => Promise<PostResult<Row>>
  searchable?: boolean
  dropdown?: DropdownInfo
}

export type DropdownInfo = {
  field: string
  options: { label: string; value: string }[]
  selected?: string
  onSelect?: (value: string) => void
}

function Header({
  onCreate,
  handleSearch,
  dropdownInfo
}: {
  onCreate: () => void
  handleSearch?: (value: string) => void
  dropdownInfo?: DropdownInfo
}) {
  const [search, setSearch] = useState('')
  const handleKeyUp: React.KeyboardEventHandler<HTMLInputElement> = async (
    e
  ) => {
    if (e.key === 'Enter' && handleSearch) {
      handleSearch(search)
    }
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        margin: '6px 0'
      }}
    >
      <button onClick={() => onCreate()}>New</button>
      <div>
        {handleSearch && (
          <React.Fragment>
            {dropdownInfo && (
              <select
                value={dropdownInfo.selected}
                onChange={(e) =>
                  dropdownInfo.onSelect && dropdownInfo.onSelect(e.target.value)
                }
                style={{
                  marginRight: '16px',
                  height: '21px',
                  lineHeight: '21px'
                }}
              >
                {dropdownInfo.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <input
              type='text'
              placeholder='Search'
              value={search}
              onKeyUp={handleKeyUp}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              style={{ marginLeft: '6px' }}
              onClick={() => handleSearch(search)}
            >
              Go
            </button>
          </React.Fragment>
        )}
      </div>
    </div>
  )
}

export function DataTable<Row>({
  columns,
  EditForm,
  pageSize,
  list,
  create,
  dropdown,
  ...props
}: DataTableProps<Row>) {
  const [pageNumber, setPageNumber] = useState(1)
  const [search, setSearch] = useState<string | undefined>()
  const [orderBy, setOrderBy] = useState<string | undefined>()
  const [count, setCount] = useState(0)
  const [selected, setSelected] = useState<string>('')

  const doList = () => {
    list({ pageNumber, pageSize, search, orderBy }).then((data) => {
      setRows(data.rows)
      setCount(data.count)
    })
  }

  // EditForm
  const [data, setData] = useState<Row | undefined>()
  const [open, setOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | undefined>()
  const handleClose = () => setOpen(false)
  const handleSave = async (row: Row) => {
    const result = await create(row)
    const error = result.error
    if (error) {
      if (error.field) {
        setFieldErrors({ [error.field]: error.message })
      } else {
        setError(error.message)
      }
    } else {
      doList()
      setOpen(false)
    }
  }

  const [rows, setRows] = useState<Row[]>([])
  const field = dropdown?.field

  useEffect(() => {
    const filter: GetParams = { pageNumber, pageSize, search, orderBy }
    if (field) {
      filter.query = { [field]: selected }
    }
    list(filter).then((data) => {
      setRows(data.rows)
      setCount(data.count)
    })
  }, [pageNumber, pageSize, search, orderBy, list, field, selected])

  const onCreate = () => {
    setData(undefined)
    setOpen(true)
  }

  const onEdit = (row: Row) => {
    setData(row)
    setOpen(true)
  }

  const onDelete = async (row: Row) => {
    if (window.confirm('Do you really want to proceed?')) {
      await props.delete(row)
      doList()
    }
  }

  const style: CSSProperties = {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 400
  }

  return (
    <div style={style}>
      <Header
        onCreate={onCreate}
        handleSearch={props.searchable === false ? undefined : setSearch}
        dropdownInfo={
          dropdown
            ? { ...dropdown, onSelect: (value) => setSelected(value) }
            : undefined
        }
      />
      <Table
        columns={columns}
        rows={rows}
        onEdit={onEdit}
        onDelete={onDelete}
        orderBy={orderBy}
        setOrderBy={setOrderBy}
      />
      <Footer
        count={count}
        pageNumber={pageNumber}
        pageSize={pageSize}
        onPrev={() => setPageNumber(pageNumber - 1)}
        onNext={() => setPageNumber(pageNumber + 1)}
      />
      {open && (
        <EditForm
          data={data}
          handleClose={handleClose}
          handleSave={handleSave}
          fieldErrors={fieldErrors}
          error={error}
        />
      )}
    </div>
  )
}

function Table<Row>({
  columns,
  rows,
  onEdit,
  onDelete,
  orderBy,
  setOrderBy
}: {
  columns: Column<Row>[]
  rows: Row[]
  onEdit: (row: Row) => void
  onDelete: (row: Row) => void
  orderBy?: string
  setOrderBy: (orderBy: string) => void
}) {
  const [height, setHeight] = useState(0)
  const ref = useRef<HTMLTableElement | null>(null)

  useEffect(() => {
    if (ref.current) {
      const styles = window.getComputedStyle(ref.current)
      setHeight(parseInt(styles.height, 10))
    }
  }, [rows, columns])

  const resizeColumn = (n: number, dw: number) => {
    if (ref.current) {
      const th = ref.current.querySelector(
        `th:nth-child(${n + 1})`
      ) as HTMLElement
      const styles = window.getComputedStyle(th)
      const w = parseInt(styles.width, 10) + dw
      th.style.width = `${w}px`
    }
  }

  const style: CSSProperties = {
    position: 'relative',
    border: '1px solid #ccc',
    borderCollapse: 'collapse',
    width: '100%'
  }

  const th: CSSProperties = {
    position: 'relative',
    border: '1px solid #ccc',
    padding: '0.5rem',
    cursor: 'default'
  }
  const td: CSSProperties = { border: '1px solid #ccc', padding: '0.5rem' }
  const button: CSSProperties = {
    backgroundColor: 'white',
    border: '0',
    cursor: 'pointer'
  }
  const name = (orderBy || '').replace(/^-/, '')
  const desc = /^-/.test(orderBy || '')

  const handleSort = (column: Column<Row>) => {
    if (column.sortable === false) {
      return
    }
    if (column.field !== name) {
      setOrderBy(column.field)
    } else {
      const prefix = desc ? '' : '-'
      setOrderBy(prefix + column.field)
    }
  }
  return (
    <table ref={ref} style={style}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              key={column.title}
              style={th}
              onClick={() => handleSort(column)}
            >
              {column.title}
              {name === column.field && (
                <span style={{ marginLeft: '6px' }}>{desc ? '↓' : '↑'}</span>
              )}
              <Resizer
                height={height}
                onResize={(dx) => resizeColumn(index, dx)}
              />
            </th>
          ))}
          <th key='edit' style={th}>
            Edit
          </th>
          <th key='delete' style={th}>
            Delete
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            {columns.map((column, index) => (
              <td key={index} style={{ ...td, ...column.style }}>
                <Cell column={column} row={row} />
              </td>
            ))}
            <td key='edit' style={td} align='center'>
              <button style={button} title='Edit' onClick={() => onEdit(row)}>
                &#9998;
              </button>
            </td>
            <td
              key='delete'
              style={td}
              align='center'
              onClick={() => onDelete(row)}
            >
              <button style={button} title='Delete'>
                &#10060;
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Cell<Row>({ column, row }: { column: Column<Row>; row: Row }) {
  if (column.render) {
    return column.render(row, column)
  }
  return (row as any)[column.field]
}

function Resizer({
  height,
  onResize
}: {
  height: number
  onResize: (dx: number) => void
}) {
  const [hover, setHover] = useState(0)

  const style: CSSProperties = {
    position: 'absolute',
    top: '0',
    right: '0',
    width: '5px',
    cursor: 'col-resize',
    userSelect: 'none',
    height: `${height}px`
  }

  if (hover) {
    style.borderRight = '2px solid blue'
  }

  const mouseDownHandler: MouseEventHandler = function (e) {
    let lastX = e.clientX
    const mouseMoveHandler = function (e: MouseEvent) {
      const dx = e.clientX - lastX
      lastX = e.clientX
      onResize(dx)
    }
    const mouseUpHandler = function () {
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
    }
    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)
  }

  const mouseEnter: MouseEventHandler = () => setHover(1)
  const mouseLeave: MouseEventHandler = () => setHover(0)

  return (
    <div
      style={style}
      onMouseDown={mouseDownHandler}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
    />
  )
}

function Footer({
  count,
  pageNumber,
  pageSize,
  onPrev,
  onNext
}: {
  count: number
  pageNumber: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
}) {
  const btnStyle: CSSProperties = {
    margin: '0 4px'
  }
  const from = (pageNumber - 1) * pageSize + 1
  const to = Math.min(pageNumber * pageSize, count)
  const hasPrev = pageNumber > 1
  const hasNext = pageNumber * pageSize < count
  return (
    <div className={styles.footer}>
      <div>
        {from}-{to} of {count}
      </div>
      <div style={{ marginLeft: '16px' }}>
        <button disabled={!hasPrev} style={btnStyle} onClick={onPrev}>
          &#10094;
        </button>
        <button disabled={!hasNext} style={btnStyle} onClick={onNext}>
          &#10095;
        </button>
      </div>
    </div>
  )
}

export type PostResult<T> = {
  data: T
  error?: {
    field?: string
    message: string
  }
}
