function ProfilePanel({ profile, onUpdateField, readOnly }) {
  return (
    <section className="profile-panel">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Information</p>
          <h2>Profile</h2>
        </div>
        <p className="subtle">
          Saved locally and displayed in the Information block for exports.
        </p>
      </div>
      <div className="profile-grid">
        <label className="profile-field">
          <span className="field-caption">Full name</span>
          <input
            type="text"
            placeholder="Full name"
            value={profile.fullName}
            onChange={(event) => onUpdateField('fullName', event.target.value)}
            disabled={readOnly}
          />
        </label>
        <label className="profile-field">
          <span className="field-caption">Student ID</span>
          <input
            type="text"
            placeholder="Student ID"
            value={profile.studentId}
            onChange={(event) => onUpdateField('studentId', event.target.value)}
            disabled={readOnly}
          />
        </label>
        <label className="profile-field">
          <span className="field-caption">Email</span>
          <input
            type="email"
            placeholder="Email"
            value={profile.email}
            onChange={(event) => onUpdateField('email', event.target.value)}
            disabled={readOnly}
          />
        </label>
      </div>
    </section>
  )
}

export default ProfilePanel
