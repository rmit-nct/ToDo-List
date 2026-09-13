import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '../schemas/authSchema'
import { z } from 'zod'
import FormError from './FormError'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '../userProfileContext'

type SignInFormData = z.infer<typeof signInSchema>

function SignInForm() {
  const navigate = useNavigate()
  const { setProfile } = useUserProfile()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = (data: SignInFormData) => {
    setProfile({ name: data.name, email: data.email })
    navigate('/workspace/web-dev/today')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Your name
        <input autoComplete="name" placeholder="Enter your name" type="text" {...register('name')} />
      </label>
      <FormError message={errors.name?.message} />

      <label>
        Email
        <input
          autoComplete="email"
          placeholder="aria@example.com"
          type="email"
          {...register('email')}
        />
      </label>

      <FormError message={errors.email?.message} />

      <label>
        Password
        <input
          autoComplete="current-password"
          placeholder="••••••••"
          type="password"
          {...register('password')}
        />
      </label>

      <FormError message={errors.password?.message} />

      <div className="auth-form-meta"><button type="button">Forgot password?</button></div>

      <button className="auth-submit" type="submit">
        Sign In →
      </button>
    </form>
  )
}

export default SignInForm
