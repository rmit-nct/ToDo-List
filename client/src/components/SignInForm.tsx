import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '../schemas/authSchema'
import { z } from 'zod'
import FormError from './FormError'
import { useNavigate } from 'react-router-dom'

type SignInFormData = z.infer<typeof signInSchema>

function SignInForm() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = (_data: SignInFormData) => {
    navigate('/workspace/web-dev/today')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Email
        <input
          placeholder="aria@example.com"
          type="email"
          {...register('email')}
        />
      </label>

      <FormError message={errors.email?.message} />

      <label>
        Password
        <input
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
