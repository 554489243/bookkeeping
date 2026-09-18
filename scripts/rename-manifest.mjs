import { renameSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const distDir = 'dist'
const oldPath = join(distDir, 'manifest.webmanifest')
const newPath = join(distDir, 'manifest.json')

if (existsSync(oldPath)) {
  renameSync(oldPath, newPath)
  console.log('✓ manifest.webmanifest → manifest.json')
}

// 更新 index.html 中的引用
const htmlPath = join(distDir, 'index.html')
if (existsSync(htmlPath)) {
  let html = readFileSync(htmlPath, 'utf-8')
  html = html.replace(/manifest\.webmanifest/g, 'manifest.json')
  writeFileSync(htmlPath, html)
  console.log('✓ index.html 引用已更新')
}
