import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUpSchema } from '../schemas/authSchema'
import FormError from './FormError'
import { useNavigate } from 'react-router-dom'
import { useUserProfile } from '../userProfileContext'

type SignUpFormData = z.infer<typeof signUpSchema>

function SignUpForm() {
  const navigate = useNavigate()
  const { setProfile } = useUserProfile()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = (data: SignUpFormData) => {
    setProfile({ name: data.name, email: data.email })
    navigate('/workspace/web-dev/today')
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Full Name
        <input
          autoComplete="name"
          placeholder="Enter your name"
          type="text"
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          type="password"
          {...register('password')}
        />
      </label>

      <FormError message={errors.password?.message} />

      <label>
        Confirm Password
        <input
          autoComplete="new-password"
          placeholder="Repeat password"
          type="password"
          {...register('confirmPassword')}
        />
      </label>

      <FormError message={errors.confirmPassword?.message} />

      <button className="auth-submit" type="submit">
        Create Account
      </button>
    </form>
  )
}

export default SignUpForm
