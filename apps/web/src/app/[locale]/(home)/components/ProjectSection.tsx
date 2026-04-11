'use client'

import { useQuery } from '@tanstack/react-query'
import { m } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { Divider } from '~/components/ui/divider'
import { MagneticHoverEffect } from '~/components/ui/effect/MagneticHoverEffect'
import { softBouncePreset } from '~/constants/spring'
import { Link } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

export const ProjectSection = () => {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: projects, isLoading } = useQuery({
    queryKey: ['home-projects'],
    queryFn: async () => {
      const data = await apiClient.project.getAll()
      return data.data?.slice(0, 6) || []
    },
    enabled: mounted,
  })

  return (
    <m.section
      initial={{ opacity: 0.0001, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={softBouncePreset}
      className="mt-8 flex flex-col gap-4 lg:mt-0"
      viewport={{ once: true }}
    >
      <h2 className="text-2xl font-medium leading-loose">
        {t('project_title')}
      </h2>

      {!mounted || isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-slate-200/80 bg-slate-100/60 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <div className="mb-3 size-10 rounded-lg bg-current opacity-30" />
              <div className="h-4 w-3/5 rounded bg-current opacity-20" />
              <div className="mt-2 h-3 w-full rounded bg-current opacity-15" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {(projects || []).map((project, index) => (
            <m.div
              key={project.id}
              initial={{ opacity: 0.0001, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                ...softBouncePreset,
                delay: index * 0.08,
              }}
            >
              <Link
                prefetch
                href={routeBuilder(Routes.Project, { id: project.id })}
                className="group block rounded-xl p-4"
              >
                <MagneticHoverEffect>
                  <div className="flex items-center gap-3">
                    {project.avatar ? (
                      <img
                        src={project.avatar}
                        alt={project.name}
                        className="size-10 shrink-0 rounded-xl ring-1 ring-slate-200 dark:ring-neutral-800"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 truncate font-medium group-hover:text-accent">
                      {project.name}
                    </span>
                  </div>
                  {project.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed opacity-60">
                      {project.description}
                    </p>
                  )}
                </MagneticHoverEffect>
              </Link>
            </m.div>
          ))}
        </div>
      )}

      <Link
        className="flex items-center justify-end opacity-70 duration-200 hover:text-accent"
        href={routeBuilder(Routes.Projects, {})}
      >
        <i className="i-mingcute-arrow-right-circle-line" />
        <span className="ml-2">{tCommon('actions_view')}</span>
      </Link>

      <Divider />
    </m.section>
  )
}
