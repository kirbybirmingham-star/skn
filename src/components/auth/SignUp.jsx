import React, { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { useToast } from '@/components/ui/use-toast'
import { Eye, EyeOff, X, ShoppingBag, Store } from 'lucide-react'

const SignUp = ({ isOpen, onOpenChange = () => {}, onLoginClick = () => {} }) => {
  const { signUp } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signUp(email, password, { role })
    setLoading(false)
    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Database error saving new user',
        variant: 'destructive'
      })
      return
    }
    toast({ title: 'Account created', description: 'Please check your email to confirm the account.' })
    onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-96 border relative">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close signup form"
        >
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold pr-8">Sign Up</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <input
              required
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">I want to register as:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  role === 'customer'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                <ShoppingBag size={16} />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                  role === 'vendor'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                <Store size={16} />
                Vendor
              </button>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-center">
          <button
            onClick={() => { onOpenChange(false); onLoginClick(); }}
            className="text-primary hover:underline"
          >
            Already have an account?
          </button>
        </div>
      </div>
    </div>
  )
}

export default SignUp
