import { useAuth } from '../../context/AuthContext'

export default function Clock() {
  const { user, clockIn, clockOut } = useAuth()
  
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Clock</h2>
      </div>
      
      <div className="page-content">
        <div className="card p-4">
          {!user?.isClockedIn ? (
            <div className="text-center">
              <p className="lead mb-3">Ready to start your shift?</p>
              <button className="btn btn-warning btn-lg w-100" onClick={clockIn}>Clock In</button>
            </div>
          ) : (
            <div className="text-center">
              <p className="lead mb-3">On shift</p>
              <button className="btn btn-outline-dark btn-lg w-100" onClick={clockOut}>Clock Out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}