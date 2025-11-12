import React, { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useToast } from '@/components/ui/use-toast'

const Login = ({ isOpen, onOpenChange = () => {}, onSignUpClick = () => {} }) => {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) return
    toast({ title: 'Signed in', description: 'You are now signed in.' })
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-lg font-bold">Sign In</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => onOpenChange(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
            <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? 'Signing in…' : 'Sign In'}</button>
          </div>
        </form>
        <div className="mt-3 text-sm text-center">
          <button onClick={() => { onOpenChange(false); onSignUpClick(); }} className="text-blue-600 underline">Create an account</button>
        </div>
      </div>
    </div>
  )
}

export default Login
