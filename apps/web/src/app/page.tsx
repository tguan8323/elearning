import { redirect } from 'next/navigation'

import { getCurrentParent } from '@/lib/api'

export default async function HomePage() {
  redirect((await getCurrentParent()) ? '/parent' : '/login')
}
