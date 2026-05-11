import * as XLSX from 'xlsx-js-style'
import { calculateDurationHours } from './time'
import { formatTitleDate } from './id'
import { DEFAULT_CHECKIN, DEFAULT_CHECKOUT } from '../constants'

const COLUMN_WIDTHS = [28, 22, 30, 36, 14, 16, 36]
const SHEET_COLUMN_COUNT = 7

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
}

const TITLE_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 16, name: 'Calibri' },
  fill: { patternType: 'solid', fgColor: { rgb: '0B3D91' } },
  alignment: { horizontal: 'center', vertical: 'center' },
}

const INFO_STYLE = {
  font: { name: 'Calibri', sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'EDF2F7' } },
  border: THIN_BORDER,
}

const INFO_LABEL_STYLE = {
  ...INFO_STYLE,
  font: { name: 'Calibri', sz: 11, bold: true },
}

const WORKLOG_HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: '1F4E79' } },
  border: THIN_BORDER,
  alignment: { horizontal: 'center', vertical: 'center' },
}

const TODO_HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'B45309' } },
  border: THIN_BORDER,
  alignment: { horizontal: 'center', vertical: 'center' },
}

const WORKLOG_ROW_STYLE = {
  font: { name: 'Calibri', sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  border: THIN_BORDER,
}

const WORKLOG_ALT_ROW_STYLE = {
  ...WORKLOG_ROW_STYLE,
  fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
}

const TODO_ROW_STYLE = {
  font: { name: 'Calibri', sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  border: THIN_BORDER,
}

const TODO_ALT_ROW_STYLE = {
  ...TODO_ROW_STYLE,
  fill: { patternType: 'solid', fgColor: { rgb: 'FFF7ED' } },
}

const WRAP_STYLE = {
  alignment: { vertical: 'top', wrapText: true },
}

const ensureCell = (sheet, rowIndex, colIndex) => {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
  if (!sheet[address]) {
    sheet[address] = { t: 's', v: '' }
  }
  return sheet[address]
}

const setCellStyle = (sheet, rowIndex, colIndex, style) => {
  const cell = ensureCell(sheet, rowIndex, colIndex)
  cell.s = style
}

const setRowStyle = (sheet, rowIndex, startCol, endCol, style) => {
  for (let col = startCol; col <= endCol; col += 1) {
    setCellStyle(sheet, rowIndex, col, style)
  }
}

const setDataRowStyle = (
  sheet,
  rowIndex,
  columnCount,
  baseStyle,
  wrapColumns = [],
) => {
  for (let col = 0; col < columnCount; col += 1) {
    const style = wrapColumns.includes(col)
      ? { ...baseStyle, alignment: WRAP_STYLE.alignment }
      : baseStyle
    setCellStyle(sheet, rowIndex, col, style)
  }
}

const applyColumnWidths = (sheet) => {
  sheet['!cols'] = COLUMN_WIDTHS.map((wch) => ({ wch }))
}

export const sanitizeSheetName = (name) => {
  const cleaned = name.replace(/[\\/*?:[\]]/g, '').trim()
  return cleaned.slice(0, 31) || 'Worklog'
}

export const buildSheet = (day, profile) => {
  const worklogHeader = [
    'Start Time',
    'End Time',
    'Project',
    'Task Description',
    'Duration (hrs)',
    'Status',
    'Notes',
  ]

  const worklogRows = day.entries.map((entry) => {
    const duration = calculateDurationHours(entry.startTime, entry.endTime)
    return [
      entry.startTime,
      entry.endTime,
      entry.project,
      entry.task,
      duration === null ? '' : Number(duration.toFixed(2)),
      entry.status,
      entry.notes,
    ]
  })

  const todoHeader = ['Task', 'Completed', 'Priority', 'Due Date', 'Notes']
  const todoRows = day.todos.map((todo) => [
    todo.task,
    todo.completed ? 'Yes' : 'No',
    todo.priority,
    todo.dueDate,
    todo.notes,
  ])

  const rows = [
    [`Worklog ${formatTitleDate(day.id)}`],
    [
      `Name: ${profile.fullName || ''}`.trim(),
      `Student ID: ${profile.studentId || ''}`.trim(),
      `Email: ${profile.email || ''}`.trim(),
    ],
    [
      `Check-in: ${day.checkIn || DEFAULT_CHECKIN}`,
      `Check-out: ${day.checkOut || DEFAULT_CHECKOUT}`,
    ],
    [],
    worklogHeader,
    ...worklogRows,
    [],
    [],
    todoHeader,
    ...todoRows,
  ]

  const sheet = XLSX.utils.aoa_to_sheet(rows)

  sheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: SHEET_COLUMN_COUNT - 1 },
    },
  ]
  sheet['!rows'] = [{ hpt: 28.05 }]

  applyColumnWidths(sheet)

  setRowStyle(sheet, 0, 0, SHEET_COLUMN_COUNT - 1, TITLE_STYLE)

  setRowStyle(sheet, 1, 0, SHEET_COLUMN_COUNT - 1, INFO_STYLE)
  for (let col = 0; col < 3; col += 1) {
    setCellStyle(sheet, 1, col, INFO_LABEL_STYLE)
  }

  setRowStyle(sheet, 2, 0, SHEET_COLUMN_COUNT - 1, INFO_STYLE)
  for (let col = 0; col < 2; col += 1) {
    setCellStyle(sheet, 2, col, INFO_LABEL_STYLE)
  }

  const worklogHeaderRow = 4
  setRowStyle(sheet, worklogHeaderRow, 0, worklogHeader.length - 1, WORKLOG_HEADER_STYLE)

  worklogRows.forEach((_, index) => {
    const rowIndex = worklogHeaderRow + 1 + index
    const rowStyle = index % 2 === 0 ? WORKLOG_ROW_STYLE : WORKLOG_ALT_ROW_STYLE
    setDataRowStyle(sheet, rowIndex, worklogHeader.length, rowStyle, [3, 6])
  })

  const todoHeaderRow = worklogHeaderRow + worklogRows.length + 3
  setRowStyle(sheet, todoHeaderRow, 0, todoHeader.length - 1, TODO_HEADER_STYLE)

  todoRows.forEach((_, index) => {
    const rowIndex = todoHeaderRow + 1 + index
    const rowStyle = index % 2 === 0 ? TODO_ROW_STYLE : TODO_ALT_ROW_STYLE
    setDataRowStyle(sheet, rowIndex, todoHeader.length, rowStyle, [4])
  })

  return sheet
}
