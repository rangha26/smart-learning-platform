import { Bell, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Header({ title, description }) {
  return (
    <header className="border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="text-xl font-semibold tracking-normal">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <label className="hidden items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground sm:flex">
            <Search className="size-4" aria-hidden="true" />
            <input
              className="w-36 border-0 bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search"
              type="text"
            />
          </label>
          <Button size="icon" type="button" variant="outline" aria-label="Notifications">
            <Bell className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
