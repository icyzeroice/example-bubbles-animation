import { timeline } from 'lib-vallina'
import { methodA, methodB } from './inside'
import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

function run () {
  app.innerHTML = `
    <h1>Hello Vite!</h1>
    <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation ${timeline()}</a>
  `
}

methodA()
methodB()

setInterval(() => {
  run()
}, 1000)
