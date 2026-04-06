import { PhysicsParticles } from '~/components/ui/background'

export const Container: Component = ({ children }) => (
  <div className="relative m-auto mt-[120px] min-h-[300px] w-full max-w-5xl px-2 md:px-6 lg:p-0">
    <div className="absolute inset-0 pointer-events-none">
      <PhysicsParticles particleCount={60} />
    </div>
    <div className="relative z-[1]">
      {children}
    </div>
  </div>
)
