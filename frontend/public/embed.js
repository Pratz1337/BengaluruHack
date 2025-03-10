(function() {
  // Create container for the chatbot
  const container = document.createElement('div');
  container.id = 'edumitra-chatbot-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999999999';
  container.style.transition = 'all 0.3s ease-in-out';
  document.body.appendChild(container);

  // Create and append iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:3000/chatbotembed';
  iframe.style.width = '480px';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
  iframe.style.backgroundColor = 'white';
  iframe.style.transition = 'all 0.3s ease-in-out';
  container.appendChild(iframe);

  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Chat with EduMitra';
  toggleButton.style.position = 'fixed';
  toggleButton.style.bottom = '20px ';
  toggleButton.style.right = '20px';
  toggleButton.style.zIndex = '1000000000000000';
  toggleButton.style.padding = '12px 24px ';
  toggleButton.style.backgroundColor = '#6366f1';
  toggleButton.style.color = 'white';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '8px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  toggleButton.style.fontSize = '14px';
  toggleButton.style.fontWeight = '500';
  toggleButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  toggleButton.style.transition = 'all 0.2s ease';

  toggleButton.onmouseover = function() {
    this.style.backgroundColor = '#4f46e5';
  };
  
  toggleButton.onmouseout = function() {
    this.style.backgroundColor = '#6366f1';
  };

  document.body.appendChild(toggleButton);

  // Toggle chatbot visibility
  let isChatbotVisible = false;
  toggleButton.addEventListener('click', () => {
    isChatbotVisible = !isChatbotVisible;
    container.style.display = isChatbotVisible ? 'block' : 'none';
    toggleButton.style.display = isChatbotVisible ? 'none' : 'block';
  });

  // Initially hide the container
  container.style.display = 'none';

  // Listen for close message from iframe
  window.addEventListener('message', function(event) {
    if (event.data === 'close-chat') {
      isChatbotVisible = false;
      container.style.display = 'none';
      toggleButton.style.display = 'block';
    }
  });
})();

