import { Link } from 'react-router-dom'

export function SignupChoice() {
  return (
    <div className="mx-auto mt-16 max-w-sm px-4 text-center">
      <h1 className="font-display text-4xl">Join JAB</h1>
      <div className="mt-8 flex flex-col gap-4">
        <Link
          to="/signup/fighter"
          className="font-display text-lg rounded bg-jab-red px-6 py-3 tracking-wide hover:bg-jab-red-dark"
        >
          I'm a Fighter
        </Link>
        <Link
          to="/signup/gym"
          className="font-display text-lg rounded border border-steel px-6 py-3 tracking-wide hover:border-bone"
        >
          I'm a Gym / Org
        </Link>
      </div>
      <p className="mt-6 text-sm text-steel-light">
        Already have an account?{' '}
        <Link to="/login" className="text-jab-red">
          Log in
        </Link>
      </p>
    </div>
  )
}
