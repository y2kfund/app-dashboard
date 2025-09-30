import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'

interface Conversation {
  id: string
  question: string
  response: string
  screenshot: string | null
  timestamp: Date
  loading: boolean
  error: string | null
}

const conversations = ref<Conversation[]>([])
const isProcessing = ref(false)

// Load conversations from localStorage on initialization
const loadConversations = () => {
  try {
    const saved = localStorage.getItem('ai-conversations')
    if (saved) {
      const parsed = JSON.parse(saved)
      conversations.value = parsed.map((conv: any) => ({
        ...conv,
        timestamp: new Date(conv.timestamp)
      }))
    }
  } catch (error) {
    console.error('Error loading conversations:', error)
  }
}

// Save conversations to localStorage
const saveConversations = () => {
  try {
    localStorage.setItem('ai-conversations', JSON.stringify(conversations.value))
  } catch (error) {
    console.error('Error saving conversations:', error)
  }
}

// Create a simplified version of the page for screenshot
const createScreenshotClone = (): HTMLElement => {
  const clone = document.body.cloneNode(true) as HTMLElement
  
  // Remove problematic elements
  const elementsToRemove = clone.querySelectorAll([
    '.modal-overlay',
    '[role="dialog"]',
    '.modal',
    '.popup',
    '.dropdown-menu',
    '.tooltip',
    'script',
    'style[data-vite-dev-id]', // Vite dev styles
    'link[data-vite-dev]'      // Vite dev links
  ].join(', '))
  
  elementsToRemove.forEach(el => el.remove())
  
  // Create a container with safe styling
  const container = document.createElement('div')
  container.style.cssText = `
    position: relative;
    width: ${window.innerWidth}px;
    height: ${window.innerHeight}px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #000000;
    overflow: hidden;
  `
  
  // Move clone content to container
  while (clone.firstChild) {
    container.appendChild(clone.firstChild)
  }
  
  return container
}

// Improved screenshot capture with CSS compatibility fixes
const captureScreenshot = async (maxRetries = 2): Promise<string | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Screenshot attempt ${attempt}/${maxRetries}`)
      
      // Method 1: Try with original body but safer options
      if (attempt === 1) {
        // Hide modals temporarily
        const modalsAndOverlays = document.querySelectorAll([
          '.modal-overlay',
          '[role="dialog"]',
          '.modal',
          '.popup',
          '.dropdown-menu',
          '.tooltip'
        ].join(', ')) as NodeListOf<HTMLElement>
        
        const originalDisplayValues: string[] = []
        
        modalsAndOverlays.forEach((element, index) => {
          originalDisplayValues[index] = element.style.display
          element.style.display = 'none'
        })
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        try {
          const canvas = await html2canvas(document.body, {
            height: window.innerHeight,
            width: window.innerWidth,
            scrollX: 0,
            scrollY: 0,
            useCORS: true,
            allowTaint: false,
            scale: 0.5,
            logging: false,
            imageTimeout: 10000,
            removeContainer: true,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false, // Disable foreign object rendering
            ignoreElements: (element) => {
              // Ignore problematic elements
              const tagName = element.tagName.toLowerCase()
              const className = element.className || ''
              
              return (
                tagName === 'script' ||
                tagName === 'style' ||
                tagName === 'link' ||
                className.includes('modal') ||
                className.includes('dropdown') ||
                className.includes('tooltip') ||
                element.getAttribute('role') === 'dialog'
              )
            }
          })
          
          // Restore modals
          modalsAndOverlays.forEach((element, index) => {
            element.style.display = originalDisplayValues[index] || ''
          })
          
          const screenshot = canvas.toDataURL('image/jpeg', 0.7)
          console.log(`Screenshot captured successfully on attempt ${attempt}`)
          return screenshot
          
        } catch (error) {
          // Restore modals even on error
          modalsAndOverlays.forEach((element, index) => {
            element.style.display = originalDisplayValues[index] || ''
          })
          throw error
        }
      }
      
      // Method 2: Fallback with DOM cloning (safer but less accurate)
      if (attempt === 2) {
        console.log('Trying fallback method with DOM cloning...')
        
        const clonedElement = createScreenshotClone()
        
        // Temporarily add to document for rendering
        clonedElement.style.position = 'fixed'
        clonedElement.style.top = '-10000px'
        clonedElement.style.left = '-10000px'
        clonedElement.style.zIndex = '-1000'
        document.body.appendChild(clonedElement)
        
        try {
          const canvas = await html2canvas(clonedElement, {
            height: window.innerHeight,
            width: window.innerWidth,
            useCORS: true,
            allowTaint: false,
            scale: 0.4,
            logging: false,
            imageTimeout: 8000,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false
          })
          
          document.body.removeChild(clonedElement)
          
          const screenshot = canvas.toDataURL('image/jpeg', 0.6)
          console.log(`Screenshot captured with fallback method`)
          return screenshot
          
        } catch (error) {
          if (document.body.contains(clonedElement)) {
            document.body.removeChild(clonedElement)
          }
          throw error
        }
      }
      
    } catch (error) {
      console.error(`Screenshot attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        console.error('All screenshot attempts failed')
        // Return a simple text-based screenshot as fallback
        return await createTextBasedScreenshot()
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
  
  return null
}

// Fallback: Create a text-based description of the page
const createTextBasedScreenshot = async (): Promise<string> => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    canvas.width = 800
    canvas.height = 600
    
    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add page info as text
    ctx.fillStyle = '#000000'
    ctx.font = '16px Arial'
    ctx.fillText(`Page: ${window.location.pathname}`, 20, 40)
    ctx.fillText(`Title: ${document.title}`, 20, 70)
    ctx.fillText(`Time: ${new Date().toLocaleString()}`, 20, 100)
    ctx.fillText('Screenshot capture failed - text summary provided', 20, 140)
    
    // Try to get some visible text content
    const textContent = document.body.innerText.slice(0, 500)
    const lines = textContent.split('\n').slice(0, 20)
    
    ctx.font = '12px Arial'
    lines.forEach((line, index) => {
      if (line.trim()) {
        ctx.fillText(line.trim().slice(0, 80), 20, 180 + (index * 20))
      }
    })
    
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch (error) {
    console.error('Text-based screenshot also failed:', error)
    return ''
  }
}

// Send question to AI with screenshot
const askQuestion = async (question: string) => {
  if (isProcessing.value || !question.trim()) return
  
  console.log('Starting AI question process...')
  isProcessing.value = true
  
  // Create conversation entry with loading state
  const conversation: Conversation = {
    id: Date.now().toString(),
    question: question.trim(),
    response: '',
    screenshot: null,
    timestamp: new Date(),
    loading: true,
    error: null
  }
  
  conversations.value.push(conversation)
  saveConversations()
  
  try {
    console.log('Capturing screenshot...')
    
    // **ALWAYS** capture screenshot before sending to AI
    const screenshot = await captureScreenshot()
    
    if (screenshot) {
      conversation.screenshot = screenshot
      console.log('Screenshot captured and stored successfully')
    } else {
      console.warn('Screenshot capture failed, proceeding without screenshot')
    }
    
    // Save conversation with screenshot
    saveConversations()
    
    // Prepare the request payload
    const payload = {
      question: conversation.question,
      screenshot: conversation.screenshot,
      timestamp: conversation.timestamp.toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      pageTitle: document.title,
      pageText: screenshot ? undefined : document.body.innerText.slice(0, 1000) // Include text if no screenshot
    }
    
    console.log('Sending request to AI API...')
    
    // Use direct worker URL for both dev and production
    const apiUrl = 'https://ai-assistant-worker.demo-cdn-v1.workers.dev/api/ai-assistant'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    console.log('AI response received:', data)
    
    conversation.response = data.response || 'Sorry, I could not process your request.'
    conversation.loading = false
    
  } catch (error) {
    console.error('Error in askQuestion:', error)
    conversation.error = error instanceof Error ? error.message : 'Failed to get response. Please try again.'
    conversation.loading = false
  }
  
  isProcessing.value = false
  saveConversations()
  
  console.log('AI question process completed')
}

// Force screenshot capture for testing
const testScreenshot = async () => {
  console.log('Testing screenshot capture...')
  const screenshot = await captureScreenshot()
  if (screenshot) {
    console.log('Test screenshot successful')
    // Create a temporary link to download the screenshot for verification
    const link = document.createElement('a')
    link.href = screenshot
    link.download = `test-screenshot-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    console.error('Test screenshot failed')
  }
}

// Clear conversation history
const clearConversations = () => {
  conversations.value = []
  saveConversations()
}

export const useAIAssistant = () => {
  // Initialize conversations on first use
  if (conversations.value.length === 0) {
    loadConversations()
  }
  
  return {
    conversations: computed(() => conversations.value),
    isProcessing: computed(() => isProcessing.value),
    askQuestion,
    clearConversations,
    testScreenshot
  }
}