import { Link } from 'react-router-dom'

export default function IndexPage() {
  const portals = [
    {
      path: '/',
      title: 'Staff Portal',
      description: 'Access clock in/out, request leave, and view your dashboard',
      icon: 'fa-users',
      color: 'primary',
      features: [
        'Multi-location clock system',
        'Leave request management', 
        'Personal dashboard',
        'Manager portal access (if applicable)'
      ]
    },
    {
      path: '/admin',
      title: 'Admin Portal',
      description: 'System administration and user management',
      icon: 'fa-user-shield',
      color: 'danger',
      features: [
        'Register new staff',
        'Manage user accounts',
        'Monitor clock activities',
        'Department & location management'
      ]
    },
    {
      path: '/security',
      title: 'Security Portal',
      description: 'Site monitoring and access control',
      icon: 'fa-shield-alt',
      color: 'warning',
      features: [
        'Real-time site monitoring',
        'Staff presence tracking',
        'Location-specific access',
        'Security activity logs'
      ]
    },
    {
      path: '/ceo',
      title: 'Executive Portal',
      description: 'Executive dashboard and strategic oversight',
      icon: 'fa-crown',
      color: 'success',
      features: [
        'Organization-wide analytics',
        'Executive leave approvals',
        'Department performance',
        'Strategic insights'
      ]
    }
  ]

  const systemFeatures = [
    {
      icon: 'fa-map-marked-alt',
      title: 'Multi-Location Support',
      description: 'Work across multiple locations with flexible clock management'
    },
    {
      icon: 'fa-sitemap',
      title: 'Hierarchical Management',
      description: 'Structured reporting relationships and approval workflows'
    },
    {
      icon: 'fa-shield-check',
      title: 'Role-Based Security',
      description: 'Secure access control with role-specific permissions'
    },
    {
      icon: 'fa-chart-line',
      title: 'Real-Time Analytics',
      description: 'Live dashboards and comprehensive reporting'
    }
  ]

  return (
    <div className="login-page login-staff">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-10">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="login-logo mb-3" style={{fontSize: '3rem', color: '#ffd54d'}}>
                StaffClock
              </div>
              <h2 className="text-white mb-2">Multi-Portal Access System</h2>
              <p className="text-light opacity-75">
                Choose your portal to access role-specific features and functionality
              </p>
            </div>

            {/* Portal Cards */}
            <div className="row g-4 mb-5">
              {portals.map((portal, index) => (
                <div key={index} className="col-lg-6">
                  <div className="card h-100 border-0 shadow-lg">
                    <div className={`card-header bg-${portal.color} text-white`}>
                      <div className="d-flex align-items-center">
                        <i className={`fas ${portal.icon} fa-2x me-3`}></i>
                        <div>
                          <h5 className="mb-0 text-white">{portal.title}</h5>
                          <small className="opacity-75">{portal.description}</small>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <h6 className="text-muted mb-3">Key Features:</h6>
                      <ul className="list-unstyled">
                        {portal.features.map((feature, idx) => (
                          <li key={idx} className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            <small>{feature}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card-footer bg-transparent">
                      <Link 
                        to={portal.path} 
                        className={`btn btn-${portal.color} w-100`}
                      >
                        <i className={`fas ${portal.icon} me-2`}></i>
                        Access {portal.title}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* System Features */}
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-lg bg-white">
                  <div className="card-header bg-dark text-white">
                    <h5 className="mb-0 text-white">
                      <i className="fas fa-cogs me-2"></i>
                      System Capabilities
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-4">
                      {systemFeatures.map((feature, index) => (
                        <div key={index} className="col-md-6">
                          <div className="d-flex align-items-start">
                            <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                              <i className={`fas ${feature.icon} fa-lg text-primary`}></i>
                            </div>
                            <div>
                              <h6 className="mb-1">{feature.title}</h6>
                              <small className="text-muted">{feature.description}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Information */}
            <div className="row mt-4">
              <div className="col-12">
                <div className="alert alert-info border-0">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-info-circle fa-2x me-3"></i>
                    <div>
                      <h6 className="mb-1">Need Help?</h6>
                      <p className="mb-0">
                        <strong>First time users:</strong> Contact your administrator for account setup and credentials.<br />
                        <strong>Forgot password?</strong> Use the "Forgot Password" link on any login page.<br />
                        <strong>Technical support:</strong> Contact your system administrator for assistance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Links */}
            <div className="row mt-3 mb-5">
              <div className="col-12 text-center">
                <h6 className="text-light mb-3">Quick Access</h6>
                <div className="d-flex justify-content-center flex-wrap gap-3">
                  <Link to="/" className="btn btn-outline-light btn-sm">
                    <i className="fas fa-users me-1"></i>
                    Staff Login
                  </Link>
                  <Link to="/admin" className="btn btn-outline-light btn-sm">
                    <i className="fas fa-user-shield me-1"></i>
                    Admin Login
                  </Link>
                  <Link to="/security" className="btn btn-outline-light btn-sm">
                    <i className="fas fa-shield-alt me-1"></i>
                    Security Login
                  </Link>
                  <Link to="/ceo" className="btn btn-outline-light btn-sm">
                    <i className="fas fa-crown me-1"></i>
                    Executive Login
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-5">
              <small className="text-light opacity-50">
                StaffClock Enterprise • Multi-Location Workforce Management System
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}