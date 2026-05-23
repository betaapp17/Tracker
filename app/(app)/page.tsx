import { redirect } from 'next/navigation'

// Route group root — redirect to named home route to avoid conflict with app/page.tsx
export default function AppGroupRoot() {
  redirect('/inicio')
}
