'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { NotFound404 } from '~/components/common/404'
import { Loading } from '~/components/ui/loading'
import { useRouter } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'

export default function Page() {
  const { id } = useParams()
  const [mounted, setMounted] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [id, 'project'],
    queryFn: async ({ queryKey }) => {
      const [id] = queryKey
      return apiClient.project.getById(id as string)
    },
    enabled: mounted,
  })

  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (data?.projectUrl) {
      window.open(data.projectUrl)
      router.back()
    }
  }, [data?.projectUrl])

  if (!mounted || isLoading) {
    return <Loading useDefaultLoadingText />
  }

  if (!data) {
    return <NotFound404 />
  }

  return null
}
