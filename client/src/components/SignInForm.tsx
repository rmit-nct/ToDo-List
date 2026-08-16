function SignInForm() {
  return (
    <form>
      <label>
        Email
        <input type="email" />
      </label>

      <label>
        Password
        <input type="password" />
      </label>

      <button type="submit">Sign In</button>
    </form>
  )
}

export default SignInForm