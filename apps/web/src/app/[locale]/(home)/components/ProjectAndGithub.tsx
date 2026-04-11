'use client'

import { ErrorBoundary } from '~/components/common/ErrorBoundary'

import { GitHubActivity } from './GitHubActivity'
import { ProjectSection } from './ProjectSection'
import { TwoColumnLayout } from './TwoColumnLayout'

export const ProjectAndGithub = () => (
  <div className="mt-24">
    <TwoColumnLayout
      rightContainerClassName="block lg:flex [&>div]:w-full px-4"
      leftContainerClassName="[&>div]:w-full px-4"
    >
      <ProjectSection />
      <ErrorBoundary>
        <GitHubActivity />
      </ErrorBoundary>
    </TwoColumnLayout>
  </div>
)
