(function() {
    // Function to add custom UI elements to Gmail
    function addCustomUI() {
      const composeButton = document.querySelector('.T-I.T-I-KE.L3');
      if (composeButton) {
        const templateButton = createButton('Use Template', useTemplate);
        composeButton.parentNode.insertBefore(templateButton, composeButton.nextSibling);
      }
    }
  
    // Helper function to create buttons
    function createButton(text, onclick) {
      const button = document.createElement('div');
      button.className = 'T-I J-J5-Ji aoO T-I-atl L3';
      button.textContent = text;
      button.onclick = onclick;
      return button;
    }
  
    // Email template function
    function useTemplate() {
      chrome.storage.sync.get(['templates'], function(result) {
        const templates = result.templates || [];
        if (templates.length === 0) {
          alert('No templates available. Please create a template first.');
          return;
        }
  
        const templateNames = templates.map(t => t.name);
        const selectedTemplate = prompt(`Select a template:\n${templateNames.join('\n')}`);
        
        if (selectedTemplate) {
          const template = templates.find(t => t.name === selectedTemplate);
          if (template) {
            // Insert template content into the compose window
            // This is a placeholder. In a real implementation, you would need to
            // inject the template content into the Gmail compose window.
            console.log(`Using template: ${template.name}`);
            console.log(`Sender emails: ${template.senderEmails.join(', ')}`);
          } else {
            alert('Template not found');
          }
        }
      });
    }
  
    // Run the script
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addCustomUI);
    } else {
      addCustomUI();
    }
  })();