export const Container: Component = ({ children }) => (
  <div className="container relative m-auto mt-[120px] max-w-7xl px-2 md:px-6 lg:px-4 xl:px-0">
    <div className="relative z-[1]">{children}</div>
  </div>
)
