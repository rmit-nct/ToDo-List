type FormErrorProps = {
  message?: string
}

function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <p className="form-error">
      {message}
    </p>
  )
}

export default FormError