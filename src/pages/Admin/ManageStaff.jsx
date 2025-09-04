import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function ManageStaff(){
  const { allUsers, updateStaff } = useAuth()
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    role: '',
    status: 'all'
  })
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({})

  const departments = [...new Set(Object.values(allUsers).map(user => user.department).filter(Boolean))]
  const managers = Object.entries(allUsers).filter(([email, user]) => 
    user.isManager && user.role === 'staff'
  )

  const filteredStaff = useMemo(() => {
    let filtered = Object.entries(allUsers).filter(([email, user]) => user.role !== 'system')

    if (filters.search) {
      filtered = filtered.filter(([email, user]) => 
        user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.department) {
      filtered = filtered.filter(([email, user]) => user.department === filters.department)
    }

    if (filters.role) {
      filtered = filtered.filter(([email, user]) => user.role === filters.role)
    }

    if (filters.status !== 'all') {
      const isVerified = filters.status === 'verified'
      filtered = filtered.filter(([email, user]) => user.verified === isVerified)
    }

    return filtered.sort(([,a], [,b]) => (a.name || '').localeCompare(b.name || ''))
  }, [allUsers, filters])

  const startEdit = (email, user) => {
    setEditingUser(email)
    setEditForm({...user})
  }

  const saveEdit = () => {
    updateStaff(editingUser, editForm)
    setEditingUser(null)
    setEditForm({})
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({})
  }

  const getRoleBadge = (role) => {
    const badges = {
      staff: 'bg-primary',
      admin: 'bg-danger',
      security: 'bg-warning text-dark',
      ceo: 'bg-success'
    }
    return badges[role] || 'bg-secondary'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Manage Staff</h2>
      </div>
      
      <div className="page-content">
        <div className="card mb-4">
          <div className="card-header">
            <h6 className="mb-0">Filters</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Search name or email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                />
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({...prev, department: e.target.value}))}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select"
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({...prev, role: e.target.value}))}
                >
                  <option value="">All Roles</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="security">Security</option>
                  <option value="ceo">CEO</option>
                </select>
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Staff Members ({filteredStaff.length})</h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(([email, user]) => (
                    <tr key={email}>
                      <td>
                        {editingUser === email ? (
                          <input 
                            className="form-control form-control-sm"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                          />
                        ) : (
                          <div>
                            <strong>{user.name}</strong>
                            {user.isManager && <span className="badge bg-info ms-2">Manager</span>}
                          </div>
                        )}
                      </td>
                      <td>
                        {editingUser === email ? (
                          <input 
                            className="form-control form-control-sm"
                            value={editForm.email || email}
                            disabled
                          />
                        ) : (
                          email
                        )}
                      </td>
                      <td>
                        {editingUser === email ? (
                          <select 
                            className="form-select form-select-sm"
                            value={editForm.department || ''}
                            onChange={(e) => setEditForm(prev => ({...prev, department: e.target.value}))}
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        ) : (
                          user.department
                        )}
                      </td>
                      <td>
                        {editingUser === email ? (
                          <select 
                            className="form-select form-select-sm"
                            value={editForm.role || ''}
                            onChange={(e) => setEditForm(prev => ({...prev, role: e.target.value}))}
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                            <option value="security">Security</option>
                            <option value="ceo">CEO</option>
                          </select>
                        ) : (
                          <span className={`badge ${getRoleBadge(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        )}
                      </td>
                      <td>
                        {editingUser === email ? (
                          <select 
                            className="form-select form-select-sm"
                            value={editForm.manager || ''}
                            onChange={(e) => setEditForm(prev => ({...prev, manager: e.target.value}))}
                          >
                            <option value="">No Manager</option>
                            {managers.map(([managerEmail, manager]) => (
                              <option key={managerEmail} value={managerEmail}>
                                {manager.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          user.manager ? allUsers[user.manager]?.name || 'Unknown' : '-'
                        )}
                      </td>
                      <td>
                        <span className={`badge ${user.verified ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {user.verified ? 'Verified' : 'Pending'}
                        </span>
                        {user.isClockedIn && <span className="badge bg-info ms-1">Clocked In</span>}
                      </td>
                      <td>
                        {editingUser === email ? (
                          <div className="btn-group btn-group-sm">
                            <button className="btn btn-success" onClick={saveEdit}>Save</button>
                            <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => startEdit(email, user)}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
