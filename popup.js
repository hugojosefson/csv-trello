(async function () {
  'use strict'

  async function getCurrentTab () {
    const queryOptions = { active: true, lastFocusedWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions)
    return tab
  }

  // TODO: register content-script.js in manifest.json as a content script
  // TODO: send a message to content-script.js with the config, to tell it to generate and download the CSV file

  function getAllCheckboxes () {
    return Array.from(document.querySelectorAll('input[type="checkbox"]'))
  }

  function getConfig () {
    const checkboxes = getAllCheckboxes()
    return Object.fromEntries(checkboxes.map(checkbox => [checkbox.id, checkbox.checked]))
  }

  /**
   * Wraps a function, delaying its actual execution until you have not called it for delay milliseconds.
   * @param fn the function to debounce
   * @param delay milliseconds to wait before actually calling the inner function
   * @returns {(function(): void)|*} a function you can call as often you like, but that will only call the inner function after delay milliseconds of silence
   */
  function debounce (fn, delay = 100) {
    let timeout
    return function () {
      clearTimeout(timeout)
      timeout = setTimeout(fn, delay)
    }
  }

  /**
   * Saves current state of checkboxes to localStorage.
   */
  function saveConfig () {
    const config = getConfig()
    globalThis.localStorage.setItem('config', JSON.stringify(config))
  }

  /**
   * Loads any config from localStorage and applies it to the checkboxes.
   */
  function loadConfig () {
    try {
      const configJson = globalThis.localStorage.getItem('config')
      const config = JSON.parse(configJson)
      if (config) {
        const checkboxes = getAllCheckboxes()
        checkboxes.forEach(checkbox => {
          if (typeof config[checkbox.id] !== 'undefined') {
            checkbox.checked = config[checkbox.id]
          }
        })
      }
    } catch (error) {
      console.warn('Error loading config:', error)
    }
  }

  /**
   * Registers click listener to an element, toggling defined checkboxes when the element is clicked.
   * @param clickElementId id for the element to click to toggle checkboxes
   * @param checkboxSelector selector for the checkboxes to toggle
   */
  function onElementClickedClickCheckboxes (clickElementId, checkboxSelector) {
    const clickElement = document.getElementById(clickElementId)
    const checkboxes = document.querySelectorAll(checkboxSelector)
    clickElement.addEventListener(
      'click',
      () => checkboxes.forEach(checkbox => checkbox.click())
    )
  }

  // Execution starts here when the popup opens.
  loadConfig()
  const debouncedSaveConfig = debounce(saveConfig)
  getAllCheckboxes().forEach(checkbox => checkbox.addEventListener('change', debouncedSaveConfig))

  onElementClickedClickCheckboxes('toggle-all', 'input[type="checkbox"]')
  onElementClickedClickCheckboxes('desc', 'input[type="checkbox"][id^="desc-"]')
  onElementClickedClickCheckboxes('labels', 'input[type="checkbox"][id^="labels-"]')

  document.getElementById('export-button').addEventListener('click', async function () {
    const config = getConfig()
    const configJson = JSON.stringify(config)
    await importModuleAndExecute(`await downloadTrelloBoardCsv(${configJson})`)
  })

  // pre-load module, execute nothing
  await importModuleAndExecute('')
})()
