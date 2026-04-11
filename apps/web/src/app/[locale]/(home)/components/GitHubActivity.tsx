'use client'

import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { m } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

import { ScrollArea } from '~/components/ui/scroll-area'
import { softBouncePreset } from '~/constants/spring'
import { fetchGitHubApi } from '~/lib/github'
import { useAppConfigSelector } from '~/providers/root/aggregation-data-provider'

import { iconClassName } from './ActivityCard'

const DEFAULT_GITHUB_USERNAME = 'littlefish1145'

type GithubActor = {
  login: string
  avatar_url: string
}
type GithubRepo = {
  name: string
}
type GithubCommit = {
  message: string
}
type GithubIssue = {
  number: number
  title: string
  html_url: string
}
type GithubPR = {
  number: number
  title: string
  html_url: string
}
type GithubRelease = {
  tag_name: string
  name: string
  html_url: string
}
type GithubMember = {
  login: string
}
type GithubForkee = {
  full_name: string
}

type GithubPayload = {
  action?: string
  ref?: string
  ref_type?: string
  size?: number
  commits?: Array<GithubCommit>
  issue?: GithubIssue
  pull_request?: GithubPR
  release?: GithubRelease
  member?: GithubMember
  forkee?: GithubForkee
}

type GithubEvent = {
  id: string
  type: string
  created_at: string
  actor: GithubActor
  repo: GithubRepo
  payload?: GithubPayload
}

const EventTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'PushEvent':
      return <i className="i-mingcute-git-commit-line" />
    case 'CreateEvent':
      return <i className="i-mingcute-add-circle-line" />
    case 'DeleteEvent':
      return <i className="i-mingcute-delete-line" />
    case 'WatchEvent':
      return <i className="i-mingcute-star-line" />
    case 'ForkEvent':
      return <i className="i-mingcute-fork-line" />
    case 'IssuesEvent':
      return <i className="i-mingcute-alert-line" />
    case 'IssueCommentEvent':
      return <i className="i-mingcute-chat-3-line" />
    case 'PullRequestEvent':
      return <i className="i-mingcute-send-plane-line" />
    case 'PullRequestReviewEvent':
      return <i className="i-mingcute-eye-line" />
    case 'ReleaseEvent':
      return <i className="i-mingcute-tag-line" />
    default:
      return <i className="i-mingcute-flash-line" />
  }
}

const formatEvent = (
  event: GithubEvent,
  t: (key: string, params?: Record<string, any>) => string,
) => {
  const repoName = event.repo.name.replace(`${event.actor.login}/`, '')
  const repoLink = `https://github.com/${event.repo.name}`

  switch (event.type) {
    case 'PushEvent': {
      const commitCount =
        event.payload?.size ?? event.payload?.commits?.length ?? 1
      return {
        text: t('github_push', { count: commitCount, repo: repoName }),
        link: repoLink,
      }
    }
    case 'CreateEvent': {
      const refType = event.payload?.ref_type || ''
      const refName = event.payload?.ref || ''
      return {
        text: t('github_create', {
          type:
            refType === 'repository'
              ? t('github_repo')
              : refType === 'branch'
                ? t('github_branch')
                : refType === 'tag'
                  ? t('github_tag')
                  : refType,
          name: refType === 'repository' ? repoName : refName,
          repo: repoName,
        }),
        link: repoLink,
      }
    }
    case 'DeleteEvent': {
      return {
        text: t('github_delete', {
          type: event.payload?.ref_type || '',
          name: event.payload?.ref || '',
          repo: repoName,
        }),
        link: repoLink,
      }
    }
    case 'WatchEvent': {
      return {
        text: t('github_star', { repo: repoName }),
        link: repoLink,
      }
    }
    case 'ForkEvent': {
      return {
        text: t('github_fork', {
          repo: repoName,
          fork: event.payload?.forkee?.full_name || '',
        }),
        link: repoLink,
      }
    }
    case 'IssuesEvent': {
      const issue = event.payload?.issue
      const action = event.payload?.action || ''
      return {
        text: t('github_issue', {
          action: action === 'opened' ? t('github_opened') : action,
          title: issue?.title || '',
          number: issue?.number || 0,
          repo: repoName,
        }),
        link: issue?.html_url || repoLink,
      }
    }
    case 'IssueCommentEvent': {
      const issue = event.payload?.issue
      return {
        text: t('github_comment', {
          title: issue?.title || '',
          number: issue?.number || 0,
          repo: repoName,
        }),
        link: issue?.html_url || repoLink,
      }
    }
    case 'PullRequestEvent': {
      const pr = event.payload?.pull_request
      const action = event.payload?.action || ''
      return {
        text: t('github_pr', {
          action: action === 'opened' ? t('github_opened') : action,
          title: pr?.title || '',
          number: pr?.number || 0,
          repo: repoName,
        }),
        link: pr?.html_url || repoLink,
      }
    }
    case 'ReleaseEvent': {
      const release = event.payload?.release
      return {
        text: t('github_release', {
          tag: release?.tag_name || '',
          name: release?.name || release?.tag_name || '',
          repo: repoName,
        }),
        link: release?.html_url || repoLink,
      }
    }
    case 'MemberEvent': {
      return {
        text: t('github_member', {
          user: event.payload?.member?.login || '',
          repo: repoName,
        }),
        link: repoLink,
      }
    }
    default: {
      return {
        text: t('github_unknown', { type: event.type, repo: repoName }),
        link: repoLink,
      }
    }
  }
}

export const GitHubActivity = () => {
  const t = useTranslations('home')
  const [mounted, setMounted] = useState(false)
  const githubUsername =
    useAppConfigSelector((config) => config.module?.github?.username) ||
    DEFAULT_GITHUB_USERNAME

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: events, isLoading } = useQuery({
    queryKey: ['github-events', githubUsername],
    queryFn: async () =>
      fetchGitHubApi<GithubEvent[]>(
        `/users/${githubUsername}/events?per_page=15`,
      ),
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled: mounted,
  })

  const displayEvents = useMemo(
    () => (events || []).filter((e) => e.type !== 'GollumEvent').slice(0, 12),
    [events],
  )

  return (
    <m.div
      initial={{ opacity: 0.0001, y: 50 }}
      transition={softBouncePreset}
      className="mt-8 w-full text-lg lg:mt-0"
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <m.h2 className="mb-8 text-2xl font-medium leading-loose lg:ml-8">
        {t('github_activity')}
      </m.h2>

      {!mounted || isLoading ? (
        <div className="relative h-[400px] max-h-[80vh]">
          <ul className="shiro-timeline mt-4 flex animate-pulse flex-col pb-4 pl-2 text-slate-200 dark:text-neutral-700!">
            {Array.from({ length: 6 })
              .fill(null)
              .map((_, i) => (
                <li key={i} className="flex w-full items-center gap-2">
                  <div
                    className={clsx(
                      iconClassName,
                      'border-0 bg-current text-inherit',
                    )}
                  />

                  <div className="mb-4 box-content h-16 w-full rounded-md bg-current" />
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <ScrollArea.ScrollArea
          mask
          rootClassName="h-[400px] relative max-h-[80vh]"
        >
          <ul className="shiro-timeline mt-4 flex flex-col pb-8 pl-2">
            {displayEvents.map((event) => {
              const formatted = formatEvent(event, t)
              const timeAgo = new Date(event.created_at).toLocaleString()

              return (
                <li key={event.id} className="flex min-w-0 justify-between">
                  <div className="relative flex flex-col gap-2 pb-4">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://github.com/${event.actor.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <img
                          src={event.actor.avatar_url}
                          alt={event.actor.login}
                          className="size-[20px] rounded-full ring-1 ring-slate-200 dark:ring-neutral-800"
                        />
                      </a>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/30 text-sm text-accent">
                        <EventTypeIcon type={event.type} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <a
                          href={formatted.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shiro-link--underline text-sm"
                        >
                          {formatted.text}
                        </a>
                        <span className="ml-2 text-xs opacity-50">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </ScrollArea.ScrollArea>
      )}
    </m.div>
  )
}
