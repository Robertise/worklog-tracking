function Notice({ notice }) {
  if (!notice) return null
  return (
    <div className={`notice ${notice.type}`} role="status">
      {notice.text}
    </div>
  )
}

export default Notice
