document.addEventListener('DOMContentLoaded', function() {
    const createTemplateButton = document.getElementById('createTemplate');
    const createReminderButton = document.getElementById('createReminder');
    const syncClassroomButton = document.getElementById('syncClassroom');
    const templateList = document.getElementById('templateList');
    const reminderList = document.getElementById('reminderList');
  
    function saveData(key, data) {
      chrome.storage.sync.set({ [key]: data }, function() {
        console.log(key + ' saved');
      });
    }
  
    function loadData(key, callback) {
      chrome.storage.sync.get([key], function(result) {
        callback(result[key] || []);
      });
    }
  
    function updateTemplateList(templates) {
      templateList.innerHTML = templates.map((template, index) => `
        <div class="item">
          <div>
            <span>${template.name}</span>
            <span class="view-emails-btn" data-index="${index}">View Emails</span>
            <span class="add-sender-btn" data-index="${index}">Add Sender</span>
            <div class="sender-list" style="display: none;">
              ${template.senderEmails.map((email, emailIndex) => `
                ${email} <span class="remove-sender-btn" data-template-index="${index}" data-email-index="${emailIndex}">❌</span>
              `).join(', ')}
            </div>
          </div>
          <button class="remove-btn" data-index="${index}" data-type="templates">Remove</button>
        </div>
      `).join('');
  
      addRemoveListeners(templateList, 'templates');
      addViewEmailsListeners();
      addAddSenderListeners();
      addRemoveSenderListeners();
    }
  
    function updateReminderList(reminders) {
      reminderList.innerHTML = reminders.map((reminder, index) => `
        <div class="item ${reminder.source === 'classroom' ? 'classroom-reminder' : ''}">
          <span>${reminder.text} (${new Date(reminder.time).toLocaleString()})</span>
          <button class="remove-btn" data-index="${index}" data-type="reminders">Remove</button>
        </div>
      `).join('');
  
      addRemoveListeners(reminderList, 'reminders');
    }
  
    function addRemoveListeners(listElement, type) {
      listElement.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeItem(type, index);
        });
      });
    }
  
    function addViewEmailsListeners() {
      templateList.querySelectorAll('.view-emails-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const senderList = this.nextElementSibling.nextElementSibling;
          senderList.style.display = senderList.style.display === 'none' ? 'block' : 'none';
        });
      });
    }
  
    function addAddSenderListeners() {
      templateList.querySelectorAll('.add-sender-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          const newSender = prompt('Enter new sender email:');
          if (newSender) {
            loadData('templates', function(templates) {
              templates[index].senderEmails.push(newSender);
              saveData('templates', templates);
              updateTemplateList(templates);
            });
          }
        });
      });
    }
  
    function addRemoveSenderListeners() {
      templateList.querySelectorAll('.remove-sender-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const templateIndex = parseInt(this.getAttribute('data-template-index'));
          const emailIndex = parseInt(this.getAttribute('data-email-index'));
          loadData('templates', function(templates) {
            templates[templateIndex].senderEmails.splice(emailIndex, 1);
            saveData('templates', templates);
            updateTemplateList(templates);
          });
        });
      });
    }
  
    function addTemplate(template) {
      loadData('templates', function(templates) {
        templates.push(template);
        saveData('templates', templates);
        updateTemplateList(templates);
      });
    }
  
    function addReminder(reminder) {
      loadData('reminders', function(reminders) {
        reminder.id = Date.now().toString();
        reminders.push(reminder);
        saveData('reminders', reminders);
        updateReminderList(reminders);
        
        // Set up alarm for the reminder
        chrome.alarms.create(`reminder_${reminder.id}`, { when: reminder.time });
      });
    }
  
    function removeItem(type, index) {
      loadData(type, function(items) {
        if (type === 'reminders') {
          const removedReminder = items[index];
          chrome.alarms.clear(`reminder_${removedReminder.id}`);
        }
        items.splice(index, 1);
        saveData(type, items);
        if (type === 'templates') {
          updateTemplateList(items);
        } else {
          updateReminderList(items);
        }
      });
    }
  
    createTemplateButton.addEventListener('click', () => {
      const templateName = prompt('Enter template name:');
      if (templateName) {
        const senderEmails = [];
        while (true) {
          const senderEmail = prompt('Enter sender email (or leave blank to finish):');
          if (senderEmail === null || senderEmail.trim() === '') break;
          senderEmails.push(senderEmail.trim());
        }
        addTemplate({ name: templateName, senderEmails: senderEmails });
      }
    });
  
    createReminderButton.addEventListener('click', () => {
      const reminderText = prompt('Enter reminder text:');
      if (reminderText) {
        const reminderDate = promptDate();
        if (reminderDate) {
          addReminder({ text: reminderText, time: reminderDate.getTime(), source: 'manual' });
        }
      }
    });
  
    syncClassroomButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'fetchClassroomAssignments' });
    });
  
    function promptDate() {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hour = now.getHours().toString().padStart(2, '0');
      const minute = now.getMinutes().toString().padStart(2, '0');
      
      const dateString = prompt('Enter reminder date and time:', `${year}-${month}-${day}T${hour}:${minute}`);
      
      if (dateString) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date;
        } else {
          alert('Invalid date format. Please use YYYY-MM-DDTHH:MM');
          return null;
        }
      }
      return null;
    }
  
    // Initial load
    loadData('templates', updateTemplateList);
    loadData('reminders', updateReminderList);
  });