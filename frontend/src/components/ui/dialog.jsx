import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Dialog({ isOpen, onClose, children, maxWidth = 'max-w-md' }) {
  // Keypress ESC to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-card border border-border/80 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors z-20 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        {children}
      </div>
    </div>
  )
}

export function DialogHeader({ children, className = '' }) {
  return <div className={`p-6 pb-4 border-b border-border/40 ${className}`}>{children}</div>
}

export function DialogTitle({ children, className = '' }) {
  return <h3 className={`text-xl font-bold tracking-tight text-foreground ${className}`}>{children}</h3>
}

export function DialogDescription({ children, className = '' }) {
  return <p className={`mt-1.5 text-sm text-muted-foreground ${className}`}>{children}</p>
}

export function DialogContent({ children, className = '' }) {
  return <div className={`p-6 overflow-y-auto ${className}`}>{children}</div>
}

export function DialogFooter({ children, className = '' }) {
  return (
    <div className={`p-6 pt-4 border-t border-border/40 bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 ${className}`}>
      {children}
    </div>
  )
}
