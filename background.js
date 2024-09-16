chrome.runtime.onInstalled.addListener(() => {
    console.log('Gmail and Classroom Management Extension installed');
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith('reminder_')) {
      const reminderId = alarm.name.split('_')[1];
      chrome.storage.sync.get(['reminders'], function(result) {
        const reminder = result.reminders.find(r => r.id === reminderId);
        if (reminder) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon48.png',
            title: 'Reminder',
            message: reminder.text,
            buttons: [{ title: 'Dismiss' }, { title: 'Snooze (5 min)' }],
            requireInteraction: true
          });
        }
      });
    }
  });
  
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 1) {  // Snooze
      chrome.alarms.create(`reminder_${notificationId}`, { delayInMinutes: 5 });
    }
    chrome.notifications.clear(notificationId);
  });
  
  // Helper function to check for new emails from template senders
  function checkNewEmails() {
    // This is a placeholder. In a real implementation, you would need to use the Gmail API
    // to check for new emails from the senders in your templates.
    console.log('Checking for new emails from template senders');
  }
  
  // Set up periodic checks for new emails
  chrome.alarms.create('checkEmails', { periodInMinutes: 5 });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkEmails') {
      checkNewEmails();
    }
  });
  
  // Function to fetch Google Classroom assignments
  function fetchClassroomAssignments() {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      fetch('https://classroom.googleapis.com/v1/courses?studentId=me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => response.json())
      .then(data => {
        data.courses.forEach(course => {
          fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(response => response.json())
          .then(workData => {
            workData.courseWork.forEach(work => {
              if (work.dueDate) {
                const dueDate = new Date(work.dueDate.year, work.dueDate.month - 1, work.dueDate.day);
                addReminder({
                  text: `${course.name}: ${work.title} due`,
                  time: dueDate.getTime(),
                  source: 'classroom'
                });
              }
            });
          });
        });
      });
    });
  }
  
  // Fetch Classroom assignments periodically
  chrome.alarms.create('fetchClassroom', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchClassroom') {
      fetchClassroomAssignments();
    }
  });