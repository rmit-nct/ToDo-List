import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '../schemas/authSchema'
import { z } from 'zod'
import FormError from './FormError'

type SignInFormData = z.infer<typeof signInSchema>

function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = (data: SignInFormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Email
        <input
          type="email"
          {...register('email')}
        />
      </label>

      <FormError message={errors.email?.message} />

      <label>
        Password
        <input
          type="password"
          {...register('password')}
        />
      </label>

      <FormError message={errors.password?.message} />

      <button type="submit">
        Sign In
      </button>
    </form>
  )
}

export default SignInForm