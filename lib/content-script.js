async function executeModule (srcText) {
  const script = document.createElement('script')
  script.type = 'module'
  script.innerHTML = srcText
  const scriptOnload = new Promise(resolve => {
    script.onload = resolve
  })

  document.head.appendChild(script)
  await scriptOnload
}

browser.runtime.onMessage.addEventListener(async function (message) {
  if (message.type === 'executeModule') {
    return await executeModule(message.srcText)
  }
})
