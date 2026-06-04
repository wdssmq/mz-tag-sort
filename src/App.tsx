import type { Component } from 'solid-js'

const App: Component = () => {
  return (
    <p class="py-20 text-center text-4xl text-green-700">
      Hello
      {' '}
      <a
        class="text-pink-600 hover:border-1 hover:font-bold"
        href="https://antfu.me/posts/reimagine-atomic-css"
        target="atomic-css"
      >
        Atomic CSS
      </a>
      !
    </p>
  )
}

export default App
