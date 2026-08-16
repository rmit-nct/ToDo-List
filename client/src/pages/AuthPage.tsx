import { useState } from 'react'
import SignInForm from '../components/SignInForm'
import SignUpForm from '../components/SignUpForm'

function AuthPage() {
  const [activeTab, setActiveTab] = useState<'sign-in' | 'sign-up'>('sign-in')

  return (
    <main>
      <section>
        <h1>Your team. One board.</h1>
        <p>
          A collaborative task-management space for student teams and club committees.
        </p>
      </section>

      <section>
        <div>
          <button onClick={() => setActiveTab('sign-in')}>
            Sign In
          </button>

          <button onClick={() => setActiveTab('sign-up')}>
            Sign Up
          </button>
        </div>

        {activeTab === 'sign-in' ? <SignInForm /> : <SignUpForm />}
      </section>
    </main>
  )
}

export default AuthPage