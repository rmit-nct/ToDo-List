import { useState } from 'react'
import SignInForm from '../components/SignInForm'
import SignUpForm from '../components/SignUpForm'
import { BrandLogo } from '../components/BrandLogo'

function AuthPage() {
  const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up'>('sign-in')

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand"><BrandLogo /></div>
        <div className="hero-copy"><h1>Your team.<br /><em>One board.</em></h1>
        <p>
          A collaborative task-management space for student teams and club committees. Turn weekly goals into trackable sprints.
        </p>
        <h2 className="features-title">Features</h2>
        <div className="auth-features"><article><span>▦</span><div><strong>Sprint Board</strong><small>To do · In progress · Done</small></div></article><article><span>◉</span><div><strong>Today View</strong><small>Your personal task focus</small></div></article><article><span>◈</span><div><strong>Progress Metrics</strong><small>Track weekly completion</small></div></article></div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-logo"><BrandLogo tone="on-light" /></div>
        <div className="auth-card">
        <div className="auth-panel-heading"><h2>{activeTab === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2><p>{activeTab === 'sign-in' ? 'Sign in to your workspace' : 'Start organizing work with your team'}</p></div>
        <div className="auth-tabs">
          <button className={activeTab === 'sign-in' ? 'active' : ''} onClick={() => setActiveTab('sign-in')}>
            Sign In
          </button>

          <button className={activeTab === 'sign-up' ? 'active' : ''} onClick={() => setActiveTab('sign-up')}>
            Sign Up
          </button>
        </div>

        {activeTab === 'sign-in' ? <SignInForm /> : <SignUpForm />}
        </div>
      </section>
    </main>
  )
}

export default AuthPage
