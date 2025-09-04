export default function IndexPage(){
  return (
    <div className="login-page login-staff">
      <div className="card login-card">
        <div className="card-header">
          <div className="login-logo">StaffClock</div>
        </div>
        <div className="card-body text-center">
          <p className="mb-0">Welcome. Choose your portal via URL paths: <code>/</code> Staff, <code>/admin</code>, <code>/security</code>, <code>/ceo</code>.</p>
        </div>
      </div>
    </div>
  )
}
