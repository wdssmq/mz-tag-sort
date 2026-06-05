import { presetMini } from '@unocss/preset-mini'
import { defineConfig } from '@unocss/vite'

export default defineConfig({
  presets: [presetMini()],
  shortcuts: {
    btn: 'border border-solid border-[#bbb] bg-white text-[#666] px-[8px] py-[2px] rounded-[4px] cursor-pointer hover:text-[#c00] hover:border-[#c88]',
  },
})
