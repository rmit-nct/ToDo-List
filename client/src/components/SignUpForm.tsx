import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signUpSchema } from '../schemas/authSchema'
import FormError from './FormError'

type SignUpFormData = z.infer<typeof signUpSchema>

function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = (data: SignUpFormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>
        Full Name
        <input
          type="text"
          {...register('name')}
        />
      </label>

      <FormError message={errors.name?.message} />

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

      <label>
        Confirm Password
        <input
          type="password"
          {...register('confirmPassword')}
        />
      </label>

      <FormError message={errors.confirmPassword?.message} />

      <button type="submit">
        Create Account
      </button>
    </form>
  )
}

export default SignUpForm