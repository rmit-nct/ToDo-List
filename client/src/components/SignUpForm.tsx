function SignUpForm() {
  return (
    <form>
      <label>
        Full Name
        <input type="text" />
      </label>

      <label>
        Email
        <input type="email" />
      </label>

      <label>
        Password
        <input type="password" />
      </label>

      <label>
        Confirm Password
        <input type="password" />
      </label>

      <button type="submit">Create Account</button>
    </form>
  )
}

export default SignUpForm