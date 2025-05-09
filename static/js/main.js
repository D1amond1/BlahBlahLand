// Initialize all components 
function initUI() {
  initSidebar();
  initAIChat();
  initSearch();
  initLogout();
  initChat();
  
  // Initialize modals but don't show them
  const addContactModal = document.getElementById("add-contact-modal");
  const createGroupModal = document.getElementById("create-group-modal");
  const contactSettingsModal = document.getElementById("contact-settings-modal");
  const addToGroupModal = document.getElementById("add-to-group-modal");
  
  // Hide standard modals
  if (addContactModal) addContactModal.style.display = "none";
  if (createGroupModal) createGroupModal.style.display = "none";
  if (contactSettingsModal) contactSettingsModal.style.display = "none";
  if (addToGroupModal) addToGroupModal.style.display = "none";

  // Special handling for group settings modal
  const groupSettingsModal = document.getElementById("group-settings-modal");
  if (groupSettingsModal) groupSettingsModal.classList.remove("show");

  // Initialize event handlers for modals
  initAddContactModal();
  initContactSettings();
  initGroupModals();

  // Check if user is logged in
  checkLoginStatus();
}

document.addEventListener("DOMContentLoaded", initUI);

// Sidebar menu handling
function initSidebar() {
  const overlay = document.getElementById("overlay");
  const sideMenu = document.getElementById("side-menu");
  const openSideMenuBtn = document.getElementById("openSideMenu");
  const closeSideMenuBtn = document.getElementById("closeSideMenu");
  const menuItems = document.querySelectorAll(".menu-item");

  if (!openSideMenuBtn || !closeSideMenuBtn) {
    return;
  }

  // Function to open sidebar menu
  function openSideMenu() {
    sideMenu.classList.add("active");
    overlay.classList.add("active");
  }

  // Function to close sidebar menu
  function closeSideMenu() {
    sideMenu.classList.remove("active");
    overlay.classList.remove("active");
  }

  // Event Listeners
  openSideMenuBtn.addEventListener("click", openSideMenu);
  closeSideMenuBtn.addEventListener("click", closeSideMenu);

  if (overlay) {
    overlay.addEventListener("click", closeSideMenu);
  }

  // Add event listeners to menu items
  menuItems.forEach(item => {
    const text = item.querySelector("span").textContent.trim();
    
    item.addEventListener("click", function(e) {
      e.preventDefault();
      
      if (text === "Add contact") {
        const modal = document.getElementById("add-contact-modal");
        if (modal) {
          modal.style.display = "block";
          closeSideMenu();
        }
      } else if (text === "Create a group") {
        openCreateGroupModal();
        closeSideMenu();
      } else if (text === "Log out") {
        logoutUser();
      }
    });
  });
}

// AI Chat functionality
function initAIChat() {
  const aiSendButton = document.getElementById("ai-send-button");
  const aiMessageInput = document.getElementById("ai-message-input");
  const aiChatMessages = document.getElementById("ai-chat-messages");
  const aiButton = document.getElementById("star"); // AI chat button (star icon)

  if (!aiSendButton || !aiMessageInput || !aiChatMessages) {
    return;
  }

  // Add click event handler for the AI button
  if (aiButton) {
    aiButton.addEventListener("click", function() {
      toggleChat();
    });
  }

  aiSendButton.addEventListener("click", sendAiMessage);
  
  // Add event listener for Enter key
  aiMessageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendAiMessage();
    }
  });

  function sendAiMessage() {
    const message = aiMessageInput.value.trim();
    if (!message) return;

    // Disable send button and input while processing
    aiSendButton.disabled = true;
    aiMessageInput.disabled = true;
    
    // Add user message to chat
    const userMessageDiv = document.createElement("div");
    userMessageDiv.className = "user-message";
    userMessageDiv.textContent = message;
    aiChatMessages.appendChild(userMessageDiv);

    // Clear input
    aiMessageInput.value = "";

    // Scroll to bottom
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    // Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "ai-message typing-indicator";
    typingIndicator.innerHTML = "AI is thinking<span>.</span><span>.</span><span>.</span>";
    aiChatMessages.appendChild(typingIndicator);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

    // Call AI API
    fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }),
    })
      .then(response => {
        // Check for HTTP errors first
        if (!response.ok) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Remove typing indicator
        if (typingIndicator.parentNode) {
          aiChatMessages.removeChild(typingIndicator);
        }
        
        // Create a container for the AI response
        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "ai-message";
        
        // Create the AI response content wrapper
        const aiContentWrapper = document.createElement("div");
        aiContentWrapper.className = "ai-content-wrapper";
        
        // Add the AI message text
        const aiTextElement = document.createElement("div");
        aiTextElement.className = "ai-text";
        
        if (data.success && data.ai_response) {
          aiTextElement.textContent = data.ai_response;
        } else {
          aiTextElement.textContent = data.message || "I'm sorry, I couldn't process your request. Please try again or ask something else.";
          aiMessageDiv.classList.add("error");
        }
        
        // Add copy button
        const copyButton = document.createElement("button");
        copyButton.className = "copy-btn";
        copyButton.innerHTML = "📋";
        copyButton.title = "Copy to clipboard";
        
        // Add event listener to copy button
        copyButton.addEventListener("click", function() {
          const textToCopy = aiTextElement.textContent;
          navigator.clipboard.writeText(textToCopy)
            .then(() => {
              // Temporarily change button to indicate success
              const originalContent = copyButton.innerHTML;
              copyButton.innerHTML = "✓";
              copyButton.classList.add("copied");
              
              setTimeout(() => {
                copyButton.innerHTML = originalContent;
                copyButton.classList.remove("copied");
              }, 1500);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
              alert('Failed to copy text. Please try again.');
            });
        });
        
        // Append elements to the DOM
        aiContentWrapper.appendChild(aiTextElement);
        aiContentWrapper.appendChild(copyButton);
        aiMessageDiv.appendChild(aiContentWrapper);
        aiChatMessages.appendChild(aiMessageDiv);

        // Scroll to bottom
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
      })
      .catch(error => {
        // Remove typing indicator if it exists
        if (typingIndicator.parentNode) {
          aiChatMessages.removeChild(typingIndicator);
        }
        
        // Add error message
        const aiMessageDiv = document.createElement("div");
        aiMessageDiv.className = "ai-message error";
        
        // Create content wrapper for the error message
        const aiContentWrapper = document.createElement("div");
        aiContentWrapper.className = "ai-content-wrapper";
        
        // Add the error text
        const aiTextElement = document.createElement("div");
        aiTextElement.className = "ai-text";
        aiTextElement.textContent = `I'm having trouble connecting right now: ${error.message}. Please try again later.`;
        
        // Add copy button
        const copyButton = document.createElement("button");
        copyButton.className = "copy-btn";
        copyButton.innerHTML = "📋";
        copyButton.title = "Copy to clipboard";
        
        // Add event listener to copy button
        copyButton.addEventListener("click", function() {
          const textToCopy = aiTextElement.textContent;
          navigator.clipboard.writeText(textToCopy)
            .then(() => {
              // Temporarily change button to indicate success
              const originalContent = copyButton.innerHTML;
              copyButton.innerHTML = "✓";
              copyButton.classList.add("copied");
              
              setTimeout(() => {
                copyButton.innerHTML = originalContent;
                copyButton.classList.remove("copied");
              }, 1500);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
              alert('Failed to copy text. Please try again.');
            });
        });
        
        // Append elements to the DOM
        aiContentWrapper.appendChild(aiTextElement);
        aiContentWrapper.appendChild(copyButton);
        aiMessageDiv.appendChild(aiContentWrapper);
        aiChatMessages.appendChild(aiMessageDiv);
        
        // Scroll to bottom
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
      })
      .finally(() => {
        // Re-enable controls
        aiSendButton.disabled = false;
        aiMessageInput.disabled = false;
        aiMessageInput.focus();
      });
  }
}

// Contact modal
function initAddContactModal() {
  const modal = document.getElementById("add-contact-modal");
  const closeButton = modal ? modal.querySelector(".close-modal") : null;
  const submitButton = document.getElementById("submit-contact");

  if (!modal || !closeButton || !submitButton) {
    console.log("Debug: Modal elements not found", { modal, closeButton, submitButton });
    return;
  }

  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
  });

  submitButton.addEventListener("click", function () {
    const contactIdentifier = document.getElementById("contact-identifier");
    const contactDisplayName = document.getElementById("contact-display-name");
    const errorMsg = document.getElementById("modal-error-msg");

    console.log("Debug: Add contact button clicked", { 
      contactIdentifier: contactIdentifier ? contactIdentifier.value : "not found", 
      contactDisplayName: contactDisplayName ? contactDisplayName.value : "not found",
      errorMsg: errorMsg ? "found" : "not found"
    });

    if (!contactIdentifier || !errorMsg) {
      console.log("Debug: Required elements missing", { contactIdentifier, errorMsg });
      return;
    }

    const identifier = contactIdentifier.value.trim();
    const displayName = contactDisplayName ? contactDisplayName.value.trim() : "";

    if (!identifier) {
      console.log("Debug: Empty identifier");
      errorMsg.textContent = "Username or email is required";
      return;
    }

    console.log("Debug: Sending contact add request", { identifier, displayName });

    // Add contact API call
    fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usernameOrEmail: identifier,
        displayName: displayName || null
      }),
    })
      .then(response => {
        console.log("Debug: Contact add response status", response.status);
        return response.json();
      })
      .then(data => {
        console.log("Debug: Contact add response data", data);
        if (data.success) {
          // Close modal and refresh contacts
          modal.style.display = "none";
          contactIdentifier.value = "";
          if (contactDisplayName) contactDisplayName.value = "";
          errorMsg.textContent = "";

          // Reload contacts to show the new contact
          loadContacts();
        } else {
          errorMsg.textContent = data.message || "Failed to add contact";
        }
      })
      .catch(error => {
        console.error("Debug: Contact add error", error);
        errorMsg.textContent = "An error occurred. Please try again.";
      });
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      const errorMsg = document.getElementById("modal-error-msg");
      if (errorMsg) errorMsg.textContent = "";
    }
  });
}

// Logout functionality
function initLogout() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  menuItems.forEach(item => {
    const text = item.querySelector('span')?.textContent.trim();
    if (text === 'Log out') {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
      });
    }
  });
}

function logoutUser() {
  fetch('/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
      }
    })
    .catch(error => {
      console.error('Error during logout:', error);
    });
}

// Check login status
function checkLoginStatus() {
  fetch('/api/me')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        currentUser = data.user;
        // Load contacts and messages
        loadContacts();
      } else {
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.endsWith('/login') &&
          !window.location.pathname.endsWith('/signup')) {
          window.location.href = '/login';
        }
      }
    })
    .catch(error => {
      // Error handling for status check
    });
}

// Global variables
let currentUser = null;
let currentContact = null;
let currentGroup = null;
let messageRefreshInterval = null;

// Initialize chat functionality
function initChat() {
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");

  if (!messageInput || !sendButton) {
    return;
  }

  // Send message on button click
  sendButton.addEventListener('click', sendMessage);

  // Send message on Enter key
  messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  // Enable auto-refresh
  messageInput.disabled = true;
  sendButton.disabled = true;
}

// Load contacts
function loadContacts() {
  const usersList = document.getElementById("users");

  if (!usersList) {
    return;
  }

  usersList.innerHTML = '<li class="loading">Loading contacts...</li>';

  fetch('/api/contacts')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (data.contacts.length === 0) {
          usersList.innerHTML = '<li class="no-results">No contacts yet</li>';
        } else {
          usersList.innerHTML = '';
          data.contacts.forEach(contact => {
            const contactItem = document.createElement('li');
            contactItem.className = 'user';
            contactItem.setAttribute('data-id', contact.id);
            contactItem.setAttribute('data-type', 'contact');
            contactItem.setAttribute('data-username', contact.username);
            contactItem.setAttribute('data-display-name', contact.display_name || '');

            contactItem.innerHTML = `
              <div class="user-info">
                <div class="user-name">${contact.display_name || contact.username}</div>
                <div class="last-message">${contact.last_message || ''}</div>
              </div>
            `;

            contactItem.addEventListener('click', function () {
              openChat(contact.id, 'contact', contact.display_name || contact.username);
            });

            usersList.appendChild(contactItem);
          });

          // Also load groups
          loadGroups();
        }
      } else {
        usersList.innerHTML = '<li class="error">Failed to load contacts</li>';
      }
    })
    .catch(error => {
      usersList.innerHTML = '<li class="error">Failed to load contacts</li>';
    });
}

// Load groups
function loadGroups() {
  const usersList = document.getElementById("users");

  if (!usersList) {
    return;
  }

  // First, remove only existing groups and separators
  const existingGroups = usersList.querySelectorAll('.user.group, .separator');
  existingGroups.forEach(item => item.remove());

  fetch('/api/groups')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.groups && data.groups.length > 0) {

        data.groups.forEach(group => {
          const groupItem = document.createElement('li');
          groupItem.className = 'user group';
          groupItem.setAttribute('data-id', group.id);
          groupItem.setAttribute('data-type', 'group');
          groupItem.setAttribute('data-name', group.name);
          groupItem.setAttribute('data-is-admin', group.is_admin);

          groupItem.innerHTML = `
            <div class="user-info">
              <div class="user-name">${group.name}</div>
              <div class="last-message">${group.last_message || ''}</div>
            </div>
          `;

          groupItem.addEventListener('click', function () {
            openChat(group.id, 'group', group.name);
          });

          usersList.appendChild(groupItem);
        });
      } else if (!data.success) {
        // Error handling for loading groups
      }
    })
    .catch(error => {
      // Error handling for group request
    });
}

// Open a chat
function openChat(id, type, name) {
  // Update current chat variables
  if (type === 'contact') {
    currentContact = id;
    currentGroup = null;
  } else {
    currentGroup = id;
    currentContact = null;
  }

  // Highlight selected chat
  document.querySelectorAll('#users .user').forEach(el => {
    el.classList.remove('active');
  });

  const selectedElement = document.querySelector(`#users .user[data-id="${id}"][data-type="${type}"]`);
  if (selectedElement) {
    selectedElement.classList.add('active');
  }

  // Update chat header
  const chatHeaderTitle = document.getElementById('chat-header-title');
  if (chatHeaderTitle) {
    chatHeaderTitle.textContent = name;
  }

  // Enable message input
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  if (messageInput && sendButton) {
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }

  // Load messages
  loadMessages(id, type);

  // Clear existing refresh interval
  if (messageRefreshInterval) {
    clearInterval(messageRefreshInterval);
  }

  // Set up auto-refresh for messages every 1 second
  messageRefreshInterval = setInterval(() => {
    if (currentContact || currentGroup) {
      loadMessages(currentContact || currentGroup, currentContact ? 'contact' : 'group');
    }
  }, 1000);
}

// Load messages for the current chat
function loadMessages(id, type) {
  const messagesContainer = document.getElementById("messages");

  if (!messagesContainer) {
    return;
  }

  let url;
  if (type === 'contact') {
    url = `/api/messages?contact_id=${id}`;
  } else {
    url = `/api/messages?group_id=${id}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        if (!data.messages || data.messages.length === 0) {
          messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
        } else {
          messagesContainer.innerHTML = '';

          data.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = msg.is_own_message ? 'message own' : 'message';
            
            // Add read class only to own messages that have been read by recipients
            if (msg.is_own_message && msg.read_by && msg.read_by.length > 0) {
              messageDiv.classList.add('read');
            }
            
            messageDiv.setAttribute('data-id', msg.id);

            // Create the message content element
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';

            // Add message actions for own messages
            if (msg.is_own_message) {
              const messageActions = document.createElement('div');
              messageActions.className = 'message-actions';
              messageActions.innerHTML = `
                <button class="edit-btn" title="Edit Message"><img src="/static/images/pen.png" alt="Edit" class="action-icon"></button>
                <button class="delete-btn" title="Delete Message"><img src="/static/images/bin.png" alt="Delete" class="action-icon"></button>
              `;
              messageContent.appendChild(messageActions);

              // Add edit button event listener
              messageActions.querySelector('.edit-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                openEditMessageModal(msg.id, msg.message);
              });
              
              // Add delete button event listener
              messageActions.querySelector('.delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                openDeleteMessageModal(msg.id);
              });
            }

            // Add sender name for messages not from the current user AND only in group chats
            if (!msg.is_own_message && type === 'group') {
              const senderNameDiv = document.createElement('div');
              senderNameDiv.className = 'sender-name';
              senderNameDiv.textContent = msg.sender_username;
              messageContent.appendChild(senderNameDiv);
            }

            // Add message text
            const messageTextDiv = document.createElement('div');
            messageTextDiv.className = 'message-text';
            messageTextDiv.textContent = msg.message;
            messageContent.appendChild(messageTextDiv);

            // Add edited label if needed
            if (msg.edited) {
              const editedLabel = document.createElement('span');
              editedLabel.className = 'edited-label';
              editedLabel.textContent = '(edited)';
              messageContent.appendChild(editedLabel);
            }

            // Append the message content to the message div
            messageDiv.appendChild(messageContent);
            messagesContainer.appendChild(messageDiv);
          });

          // Scroll to bottom
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      } else {
        messagesContainer.innerHTML = '<div class="error-message">Failed to load messages</div>';
      }
    })
    .catch(error => {
      messagesContainer.innerHTML = '<div class="error-message">Failed to load messages</div>';
    });
}

// Format timestamp for display (removed from messages but keeping for other uses)
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Send a message
function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const messagesContainer = document.getElementById("messages");

  if (!messageInput || !messagesContainer) {
    return;
  }

  const messageText = messageInput.value.trim();

  if (!messageText) {
    return;
  }

  if (!currentContact && !currentGroup) {
    return;
  }

  let data;
  if (currentContact) {
    data = {
      message: messageText,
      receiver_id: currentContact,
      add_as_contact: true // This will ensure the recipient also has us as a contact
    };
  } else if (currentGroup) {
    data = {
      message: messageText,
      group_id: currentGroup
    };
  }

  // Clear and disable input until message is sent
  messageInput.value = '';
  messageInput.disabled = true;
  const sendButton = document.getElementById("send-button");
  if (sendButton) sendButton.disabled = true;

  fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      // Re-enable input
      messageInput.disabled = false;
      if (sendButton) sendButton.disabled = false;
      messageInput.focus();

      if (data.success) {
        // Create message div for own message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message own'; // New messages are unread by recipients
        messageDiv.setAttribute('data-id', data.message.id);

        // Create message content container
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Add message actions (edit and delete buttons)
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';
        messageActions.innerHTML = `
          <button class="edit-btn" title="Edit Message"><img src="/static/images/pen.png" alt="Edit" class="action-icon"></button>
          <button class="delete-btn" title="Delete Message"><img src="/static/images/bin.png" alt="Delete" class="action-icon"></button>
        `;
        messageContent.appendChild(messageActions);

        // Add event listeners for buttons
        messageActions.querySelector('.edit-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          openEditMessageModal(data.message.id, data.message.message);
        });
        
        messageActions.querySelector('.delete-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          openDeleteMessageModal(data.message.id);
        });

        // Add message text
        const messageTextDiv = document.createElement('div');
        messageTextDiv.className = 'message-text';
        messageTextDiv.textContent = data.message.message;
        messageContent.appendChild(messageTextDiv);

        // Add edited label if needed
        if (data.message.edited) {
          const editedLabel = document.createElement('span');
          editedLabel.className = 'edited-label';
          editedLabel.textContent = '(edited)';
          messageContent.appendChild(editedLabel);
        }

        // Append the message content to the message div
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        alert("Failed to send message. Please try again.");
      }
    })
    .catch(error => {
      // Re-enable input
      messageInput.disabled = false;
      if (sendButton) sendButton.disabled = false;

      alert("Failed to send message. Please try again.");
    });
}

// Initialize contact settings modal
function initContactSettings() {
  // Set up settings button event
  const settingsButton = document.getElementById("settings");
  if (settingsButton) {
    settingsButton.addEventListener("click", function () {
      // Check if a contact is selected
      if (currentContact) {
        const contactElement = document.querySelector(`#users .user[data-id="${currentContact}"][data-type="contact"]`);
        if (contactElement) {
          const username = contactElement.getAttribute("data-username");
          const displayName = contactElement.getAttribute("data-display-name");
          openContactSettings(currentContact, username, displayName);
        }
      }
      // Check if a group is selected
      else if (currentGroup) {
        openGroupSettings(currentGroup);
      }
      else {
        alert("Please select a contact or group first");
      }
    });
  }

  // Create modal if it doesn't exist
  if (!document.getElementById("contact-settings-modal")) {
    const modal = document.createElement('div');
    modal.id = "contact-settings-modal";
    modal.className = "modal";

    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <div id="contact-settings-error" class="error-message"></div>
        <input type="hidden" id="contact-id">
        <div class="username-header">
          <p>Username: <span id="contact-username"></span></p>
        </div>
        <input type="text" id="contact-display-name-edit" placeholder="Display Name" class="form-input">
        <div class="modal-actions">
          <button id="update-contact" class="btn primary">Update</button>
          <button id="delete-contact" class="btn danger">Delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close button event
    const closeButton = modal.querySelector(".close-modal");
    closeButton.addEventListener("click", function(event) {
      event.preventDefault();
      event.stopPropagation();
      hideContactSettingsModal();
    });

    // Update contact button
    const updateButton = document.getElementById("update-contact");
    updateButton.addEventListener("click", updateContactDisplayName);

    // Delete contact button
    const deleteButton = document.getElementById("delete-contact");
    deleteButton.addEventListener("click", deleteContact);

    // Close modal when clicking outside
    modal.addEventListener("click", function(event) {
      if (event.target === modal) {
        hideContactSettingsModal();
      }
    });
    
    // Prevent clicks within modal content from closing the modal
    const modalContent = modal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.addEventListener("click", function(event) {
        event.stopPropagation();
      });
    }
  }
}

// Show the contact settings modal
function showContactSettingsModal() {
  const modal = document.getElementById("contact-settings-modal");
  if (modal) {
    // First remove any inline styles that might be interfering
    modal.style = "";
    // Then add the show class
    modal.classList.add("show");
    // Force the browser to redraw the modal to ensure it's displayed correctly
    void modal.offsetHeight;
  }
}

// Hide the contact settings modal
function hideContactSettingsModal() {
  const modal = document.getElementById("contact-settings-modal");
  if (modal) {
    // Remove the show class
    modal.classList.remove("show");
    // Clear any error messages
    const errorMsg = document.getElementById("contact-settings-error");
    if (errorMsg) {
      errorMsg.textContent = "";
    }
  }
}

// Open contact settings modal
function openContactSettings(contactId, username, displayName) {
  // Initialize modal if it doesn't exist
  initContactSettings();

  const modal = document.getElementById("contact-settings-modal");
  const contactIdInput = document.getElementById("contact-id");
  const usernameSpan = document.getElementById("contact-username");
  const displayNameInput = document.getElementById("contact-display-name-edit");
  const errorMsg = document.getElementById("contact-settings-error");

  // Reset error message
  errorMsg.textContent = "";

  // Set current contact values
  contactIdInput.value = contactId;
  usernameSpan.textContent = username;
  displayNameInput.value = displayName || "";

  // Show modal
  showContactSettingsModal();

  // Focus on display name input
  displayNameInput.focus();
}

// Update contact display name
function updateContactDisplayName() {
  const contactId = document.getElementById("contact-id").value;
  const displayName = document.getElementById("contact-display-name-edit").value.trim();
  const errorMsg = document.getElementById("contact-settings-error");

  fetch(`/api/contacts/${contactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName: displayName
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh contacts
        hideContactSettingsModal();
        errorMsg.textContent = "";
        loadContacts();
      } else {
        errorMsg.textContent = data.message || "Failed to update contact";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Delete contact
function deleteContact() {
  const contactId = document.getElementById("contact-id").value;
  const errorMsg = document.getElementById("contact-settings-error");

  if (!confirm("Are you sure you want to delete this contact?")) {
    return;
  }

  fetch(`/api/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh contacts
        hideContactSettingsModal();
        errorMsg.textContent = "";
        loadContacts();

        // If this was the current chat, clear it
        if (currentContact === parseInt(contactId)) {
          currentContact = null;
          document.getElementById("messages").innerHTML = '<div class="no-messages">Select a contact to start chatting</div>';

          // Update chat header
          const chatHeaderTitle = document.getElementById('chat-header-title');
          if (chatHeaderTitle) {
            chatHeaderTitle.textContent = "Select a conversation";
          }

          // Disable message input
          const messageInput = document.getElementById("message-input");
          const sendButton = document.getElementById("send-button");
          if (messageInput && sendButton) {
            messageInput.disabled = true;
            sendButton.disabled = true;
          }
        }
      } else {
        errorMsg.textContent = data.message || "Failed to delete contact";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Group management functionality
function initGroupModals() {
  // Create the create group modal if it doesn't exist
  if (!document.getElementById("create-group-modal")) {
    createGroupModalElement();
  }

  // Create the group settings modal if it doesn't exist
  if (!document.getElementById("group-settings-modal")) {
    createGroupSettingsModalElement();
  }

  // Create the add contact to group modal if it doesn't exist
  if (!document.getElementById("add-to-group-modal")) {
    createAddToGroupModalElement();
  }

  // Hide all modals on initialization
  const modals = [
    "create-group-modal",
    "add-to-group-modal",
    "add-contact-modal",
    "contact-settings-modal"
  ];

  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  });

  // Special handling for group settings modal since it uses classes
  const groupSettingsModal = document.getElementById("group-settings-modal");
  if (groupSettingsModal) {
    groupSettingsModal.classList.remove("show");
  }
}

// Create the create group modal element
function createGroupModalElement() {
  const modal = document.createElement('div');
  modal.id = "create-group-modal";
  modal.className = "modal";
  modal.style.display = "none"; // Явно скрываем при создании

  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2>Create a group</h2>
      <div id="create-group-error" class="error-message"></div>
      <input type="text" id="group-name" placeholder="Group Name" class="form-input">
      <div class="contacts-list" id="group-contacts-list">
        <div class="loading">Loading contacts...</div>
      </div>
      <button id="create-group-btn" class="btn primary">Create</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button event
  const closeButton = modal.querySelector(".close-modal");
  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // Add event listener for create group button
  const createGroupBtn = modal.querySelector("#create-group-btn");
  if (createGroupBtn) {
    createGroupBtn.addEventListener("click", createGroup);
  }

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Create the group settings modal element
function createGroupSettingsModalElement() {
  // Remove existing modal if it exists
  const existingModal = document.getElementById("group-settings-modal");
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = "group-settings-modal";
  modal.className = "modal";
  // No need to set style.display here as it's handled by CSS

  modal.innerHTML = `
    <div class="modal-content">
      <div class="search-header admin-only">
        <input type="text" id="group-name-edit" class="form-input" placeholder="Group Name">
        <span class="close-modal">&times;</span>
      </div>
      <div class="search-header user-only" style="display: none;">
        <h3 id="group-name-label">Group Name</h3>
        <span class="close-modal">&times;</span>
      </div>
      <div id="group-settings-error" class="error-message"></div>
      
      <!-- Admin view -->
      <div id="admin-settings" style="display: none;">
        <div class="add-contact-btn-wrapper">
          <div class="add-contact-header">
            <img src="/static/images/add-contact.png" alt="" class="add-contact-icon">
            <span>Add contact</span>
          </div>
        </div>
        <div id="group-members-list" class="members-list">
          <div class="loading">Loading members...</div>
        </div>
        <div class="modal-actions">
          <button id="update-group-btn" class="btn primary">Update</button>
          <button id="delete-group-btn" class="btn danger">Delete Group</button>
        </div>
      </div>
      
      <!-- Regular member view -->
      <div id="member-settings" style="display: none;">
        <h3>Admin</h3>
        <div id="group-admin" class="admin-info"></div>
        <h3>Participants</h3>
        <div id="group-participants" class="participants-list"></div>
        <div class="modal-actions">
          <button id="leave-group-btn" class="btn danger">Leave Group</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button event
  const closeButtons = modal.querySelectorAll(".close-modal");
  closeButtons.forEach(button => {
    button.addEventListener("click", function(event) {
      event.preventDefault();
      event.stopPropagation();
      hideGroupSettingsModal();
    });
  });

  // Add contacts to group button
  const addToGroupHeader = modal.querySelector(".add-contact-header");
  if (addToGroupHeader) {
    addToGroupHeader.addEventListener("click", function() {
      hideGroupSettingsModal();
      openAddToGroupModal(currentGroup);
    });
  }

  // Update group button
  const updateGroupBtn = modal.querySelector("#update-group-btn");
  updateGroupBtn.addEventListener("click", updateGroup);

  // Delete group button
  const deleteGroupBtn = modal.querySelector("#delete-group-btn");
  deleteGroupBtn.addEventListener("click", deleteGroup);

  // Leave group button
  const leaveGroupBtn = modal.querySelector("#leave-group-btn");
  if (leaveGroupBtn) {
    leaveGroupBtn.addEventListener("click", leaveGroup);
  }

  // Close modal when clicking outside
  modal.addEventListener("click", function(event) {
    if (event.target === modal) {
      hideGroupSettingsModal();
    }
  });
  
  // Prevent clicks within modal content from closing the modal
  const modalContent = modal.querySelector(".modal-content");
  if (modalContent) {
    modalContent.addEventListener("click", function(event) {
      event.stopPropagation();
    });
  }
}

// Show the group settings modal
function showGroupSettingsModal() {
  const modal = document.getElementById("group-settings-modal");
  if (modal) {
    // First remove any inline styles that might be interfering
    modal.style = "";
    // Then add the show class
    modal.classList.add("show");
    // Force the browser to redraw the modal to ensure it's displayed correctly
    void modal.offsetHeight;
  }
}

// Hide the group settings modal
function hideGroupSettingsModal() {
  const modal = document.getElementById("group-settings-modal");
  if (modal) {
    // Remove the show class
    modal.classList.remove("show");
    // Clear any error messages
    const errorMsg = document.getElementById("group-settings-error");
    if (errorMsg) {
      errorMsg.textContent = "";
    }
  }
}

// Open group settings modal
function openGroupSettings(groupId) {
  // Initialize modal if it doesn't exist
  if (!document.getElementById("group-settings-modal")) {
    createGroupSettingsModalElement();
  }

  const modal = document.getElementById("group-settings-modal");
  const errorMsg = document.getElementById("group-settings-error");

  // Reset error message
  if (errorMsg) {
    errorMsg.textContent = "";
  }

  // Fetch group details
  fetch(`/api/groups/${groupId}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const group = data.group;

        // Determine if user is an admin
        if (group.is_admin) {
          // Show admin view
          document.getElementById("admin-settings").style.display = "block";
          document.getElementById("member-settings").style.display = "none";
          
          // Show admin header, hide user header
          modal.querySelector(".search-header.admin-only").style.display = "flex";
          modal.querySelector(".search-header.user-only").style.display = "none";

          // Set group name for editing
          document.getElementById("group-name-edit").value = group.name;

          // Display members with checkboxes for removal, but exclude admins
          const membersContainer = document.getElementById("group-members-list");
          membersContainer.innerHTML = '';

          // Filter out admins from the member list
          const nonAdminMembers = group.members.filter(member => !member.is_admin);

          nonAdminMembers.forEach(member => {
            const memberItem = document.createElement('div');
            memberItem.className = 'member-item';

            // Determine if this member is a creator or self
            const isCreator = member.id === group.created_by;
            const isSelf = member.id === currentUser.id;

            // Don't allow removing creator or self
            const isCheckable = !isCreator && !isSelf;

            memberItem.innerHTML = `
              <label class="checkbox-container ${isCheckable ? '' : 'disabled'}">
                <input type="checkbox" value="${member.id}" ${isCheckable ? '' : 'disabled'}>
                <span class="checkbox-label">
                  ${member.username} 
                  ${isCreator ? '<span class="member-role">(Creator)</span>' : ''} 
                  ${isSelf ? '<span class="member-role">(You)</span>' : ''}
                </span>
              </label>
            `;

            membersContainer.appendChild(memberItem);
          });
        } else {
          // Show regular member view
          document.getElementById("admin-settings").style.display = "none";
          document.getElementById("member-settings").style.display = "block";
          
          // Show user header, hide admin header
          modal.querySelector(".search-header.admin-only").style.display = "none";
          modal.querySelector(".search-header.user-only").style.display = "flex";
          
          // Set group name label
          document.getElementById("group-name-label").textContent = group.name;

          // Display admin info
          const adminContainer = document.getElementById("group-admin");
          adminContainer.innerHTML = '';

          const admins = group.members.filter(member => member.is_admin);
          admins.forEach(admin => {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-item';
            adminItem.textContent = admin.username;
            adminContainer.appendChild(adminItem);
          });

          // Display participants
          const participantsContainer = document.getElementById("group-participants");
          participantsContainer.innerHTML = '';

          group.members.forEach(member => {
            if (!member.is_admin) {
              const participantItem = document.createElement('div');
              participantItem.className = 'participant-item';
              participantItem.textContent = member.username;
              participantsContainer.appendChild(participantItem);
            }
          });
        }

        // Show modal
        showGroupSettingsModal();
      } else {
        alert("Failed to load group details. Please try again.");
      }
    })
    .catch(error => {
      alert("Failed to load group details. Please try again.");
  });
}

// Create the add contact to group modal element
function createAddToGroupModalElement() {
  const modal = document.createElement('div');
  modal.id = "add-to-group-modal";
  modal.className = "modal";
  modal.style.display = "none"; // Явно скрываем при создании

  modal.innerHTML = `
    <div class="modal-content">
      <div class="search-header">
        <div class="search-input-container">
          <img src="/static/images/search.png" class="search-icon" alt="">
          <input type="text" id="contact-search" placeholder="Find contact" class="form-input">
        </div>
        <span class="close-modal">&times;</span>
      </div>
      <div id="add-to-group-error" class="error-message"></div>
      <input type="hidden" id="target-group-id">
      <div id="contacts-to-add" class="contacts-list">
        <div class="loading">Loading contacts...</div>
      </div>
      <button id="add-selected-contacts" class="btn primary">Add</button>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button event
  const closeButton = modal.querySelector(".close-modal");
  closeButton.addEventListener("click", function () {
    modal.style.display = "none";
    document.getElementById("add-to-group-error").textContent = "";
  });

  // Add selected contacts button
  const addButton = document.getElementById("add-selected-contacts");
  addButton.addEventListener("click", addContactsToGroup);

  // Contact search input
  const searchInput = document.getElementById("contact-search");
  searchInput.addEventListener("input", function () {
    filterContactsList(this.value);
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      document.getElementById("add-to-group-error").textContent = "";
    }
  });
}

// Open create group modal
function openCreateGroupModal() {
  // Initialize modal if it doesn't exist
  if (!document.getElementById("create-group-modal")) {
    createGroupModalElement();
  }

  const modal = document.getElementById("create-group-modal");
  const contactsList = document.getElementById("group-contacts-list");
  const errorMsg = document.getElementById("create-group-error");

  // Reset error message
  errorMsg.textContent = "";

  // Clear group name input
  document.getElementById("group-name").value = "";

  // Load contacts for selection
  loadContactsForSelection(contactsList);

  // Show modal
  modal.style.display = "block";
}

// Load contacts for group creation or adding to a group
function loadContactsForSelection(containerElement, isAddToGroup = false) {
  containerElement.innerHTML = '<div class="loading">Loading contacts...</div>';

  if (isAddToGroup) {
    // Получаем ID группы, для которой добавляем контакты
    const groupId = document.getElementById("target-group-id").value;
    
    // Сначала получаем членов группы
    fetch(`/api/groups/${groupId}`)
      .then(response => response.json())
      .then(groupData => {
        if (groupData.success) {
          const groupMemberIds = groupData.group.members.map(member => member.id);
          
          // Затем получаем все контакты и фильтруем тех, кто уже в группе
          fetch('/api/contacts')
            .then(response => response.json())
            .then(contactsData => {
              if (contactsData.success) {
                if (contactsData.contacts.length === 0) {
                  containerElement.innerHTML = '<div class="no-results">Нет доступных контактов</div>';
                } else {
                  // Фильтруем контакты, которых еще нет в группе
                  const availableContacts = contactsData.contacts.filter(contact => 
                    !groupMemberIds.includes(contact.id)
                  );
                  
                  if (availableContacts.length === 0) {
                    containerElement.innerHTML = '<div class="no-results">Все контакты уже в группе</div>';
                  } else {
                    containerElement.innerHTML = '';
                    
                    availableContacts.forEach(contact => {
                      const contactItem = document.createElement('div');
                      contactItem.className = 'contact-item';
                      
                      contactItem.innerHTML = `
                        <label class="checkbox-container">
                          <input type="checkbox" value="${contact.id}">
                          <span class="checkbox-label">${contact.display_name || contact.username}</span>
                        </label>
                      `;
                      
                      containerElement.appendChild(contactItem);
                    });
                  }
                }
              } else {
                containerElement.innerHTML = '<div class="error">Не удалось загрузить контакты</div>';
              }
            })
            .catch(error => {
              containerElement.innerHTML = '<div class="error">Не удалось загрузить контакты</div>';
            });
        } else {
          containerElement.innerHTML = '<div class="error">Не удалось загрузить информацию о группе</div>';
        }
      })
      .catch(error => {
        containerElement.innerHTML = '<div class="error">Не удалось загрузить информацию о группе</div>';
      });
  } else {
    // Стандартное отображение контактов для других случаев (создание группы)
    fetch('/api/contacts')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (data.contacts.length === 0) {
            containerElement.innerHTML = '<div class="no-results">Нет доступных контактов</div>';
          } else {
            containerElement.innerHTML = '';
            
            data.contacts.forEach(contact => {
              const contactItem = document.createElement('div');
              contactItem.className = 'contact-item';
              
              contactItem.innerHTML = `
                <label class="checkbox-container">
                  <input type="checkbox" value="${contact.id}" data-username="${contact.username}">
                  <span class="checkbox-label">${contact.display_name || contact.username}</span>
                </label>
              `;
              
              containerElement.appendChild(contactItem);
            });
          }
        } else {
          containerElement.innerHTML = '<div class="error">Не удалось загрузить контакты</div>';
        }
      })
      .catch(error => {
        containerElement.innerHTML = '<div class="error">Не удалось загрузить контакты</div>';
      });
  }
}

// Filter contacts list based on search input
function filterContactsList(searchTerm) {
  const contactsContainer = document.getElementById("contacts-to-add");
  const contactItems = contactsContainer.querySelectorAll('.contact-item');

  searchTerm = searchTerm.toLowerCase();

  contactItems.forEach(item => {
    const label = item.querySelector('.checkbox-label').textContent.toLowerCase();

    if (label.includes(searchTerm)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Create a new group
function createGroup() {
  const groupName = document.getElementById("group-name").value.trim();
  const errorMsg = document.getElementById("create-group-error");
  const selectedContacts = Array.from(document.querySelectorAll('#group-contacts-list input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.value));

  if (!groupName) {
    errorMsg.textContent = "Group name is required";
    return;
  }

  if (selectedContacts.length === 0) {
    errorMsg.textContent = "Please select at least one contact";
    return;
  }

  fetch('/api/groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: groupName,
      members: selectedContacts
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh groups
        document.getElementById("create-group-modal").style.display = "none";
        errorMsg.textContent = "";

        // Reload groups to show the new group
        loadGroups();
      } else {
        errorMsg.textContent = data.message || "Failed to create group";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Add selected contacts to a group
function addContactsToGroup() {
  const groupId = document.getElementById("target-group-id").value;
  const errorMsg = document.getElementById("add-to-group-error");
  const selectedContacts = Array.from(document.querySelectorAll('#contacts-to-add input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.value));

  if (selectedContacts.length === 0) {
    errorMsg.textContent = "Please select at least one contact";
    return;
  }

  fetch(`/api/groups/${groupId}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      members: selectedContacts
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh group settings
        document.getElementById("add-to-group-modal").style.display = "none";
        errorMsg.textContent = "";

        // Reopen group settings to show updated members
        openGroupSettings(groupId);
      } else {
        errorMsg.textContent = data.message || "Failed to add contacts to group";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Update group settings
function updateGroup() {
  const errorMsg = document.getElementById("group-settings-error");
  const groupName = document.getElementById("group-name-edit").value.trim();

  if (!groupName) {
    errorMsg.textContent = "Group name is required";
    return;
  }

  // Get selected members to remove
  const membersToRemove = Array.from(document.querySelectorAll('#group-members-list input[type="checkbox"]:checked'))
    .map(checkbox => parseInt(checkbox.value));

  fetch(`/api/groups/${currentGroup}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: groupName,
      remove_members: membersToRemove
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh groups
        hideGroupSettingsModal();
        errorMsg.textContent = "";

        // Reload groups to show updates
        loadGroups();

        // Update chat header if this is the current group
        const chatHeaderTitle = document.getElementById('chat-header-title');
        if (chatHeaderTitle && currentGroup) {
          chatHeaderTitle.textContent = groupName;
        }
      } else {
        errorMsg.textContent = data.message || "Failed to update group";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Delete group
function deleteGroup() {
  if (!confirm("Are you sure you want to delete this group?")) {
    return;
  }

  const errorMsg = document.getElementById("group-settings-error");

  fetch(`/api/groups/${currentGroup}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh groups
        hideGroupSettingsModal();
        errorMsg.textContent = "";

        // Clear current group if this was it
        if (currentGroup) {
          currentGroup = null;
          document.getElementById("messages").innerHTML = '<div class="no-messages">Select a conversation</div>';

          // Update chat header
          const chatHeaderTitle = document.getElementById('chat-header-title');
          if (chatHeaderTitle) {
            chatHeaderTitle.textContent = "Select a conversation";
          }

          // Disable message input
          const messageInput = document.getElementById("message-input");
          const sendButton = document.getElementById("send-button");
          if (messageInput && sendButton) {
            messageInput.disabled = true;
            sendButton.disabled = true;
          }
        }

        // Reload groups
        loadGroups();
      } else {
        errorMsg.textContent = data.message || "Failed to delete group";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Leave group
function leaveGroup() {
  if (!confirm("Are you sure you want to leave this group?")) {
    return;
  }

  const errorMsg = document.getElementById("group-settings-error");

  fetch(`/api/groups/${currentGroup}/leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Close modal and refresh groups
        hideGroupSettingsModal();
        errorMsg.textContent = "";

        // Clear current group if this was it
        if (currentGroup) {
          currentGroup = null;
          document.getElementById("messages").innerHTML = '<div class="no-messages">Select a conversation</div>';

          // Update chat header
          const chatHeaderTitle = document.getElementById('chat-header-title');
          if (chatHeaderTitle) {
            chatHeaderTitle.textContent = "Select a conversation";
          }

          // Disable message input
          const messageInput = document.getElementById("message-input");
          const sendButton = document.getElementById("send-button");
          if (messageInput && sendButton) {
            messageInput.disabled = true;
            sendButton.disabled = true;
          }
        }

        // Reload groups
        loadGroups();
      } else {
        errorMsg.textContent = data.message || "Failed to leave group";
      }
    })
    .catch(error => {
      errorMsg.textContent = "An error occurred. Please try again.";
    });
}

// Initialize search functionality
function initSearch() {
  const searchInput = document.getElementById("contact-search-input");
  
  if (!searchInput) {
    return;
  }
  
  searchInput.addEventListener("input", function() {
    const searchTerm = this.value.trim().toLowerCase();
    filterContacts(searchTerm);
  });
}

// Filter contacts and groups based on search term
function filterContacts(searchTerm) {
  const userItems = document.querySelectorAll("#users .user");
  
  userItems.forEach(item => {
    const userName = item.querySelector(".user-name").textContent.toLowerCase();
    const lastMessage = item.querySelector(".last-message").textContent.toLowerCase();
    
    if (userName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

// Message edit and delete functions
function openEditMessageModal(messageId, messageText) {
  // Check if modal already exists
  let modal = document.getElementById('edit-message-modal');
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-message-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Edit message</h2>
        <input type="text" id="edit-message-input" class="form-input">
        <button id="save-edit-btn" class="btn primary full-width">Edit</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    
    // Close on click outside the modal content
    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Set current message text
  const messageInput = modal.querySelector('#edit-message-input');
  messageInput.value = messageText;
  
  // Update save button action
  const saveButton = modal.querySelector('#save-edit-btn');
  
  // Remove existing event listeners from the save button
  const newSaveButton = saveButton.cloneNode(true);
  saveButton.parentNode.replaceChild(newSaveButton, saveButton);
  
  // Add new event listener
  newSaveButton.addEventListener('click', function() {
    const newText = messageInput.value.trim();
    if (newText && newText !== messageText) {
      updateMessage(messageId, newText);
    }
    modal.style.display = 'none';
  });
  
  // Show modal
  modal.style.display = 'block';
  
  // Focus on input
  messageInput.focus();
}

function openDeleteMessageModal(messageId) {
  // Check if modal already exists
  let modal = document.getElementById('delete-message-modal');
  
  // Create modal if it doesn't exist
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'delete-message-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Delete this message?</h2>
        <button id="delete-btn" class="btn danger full-width">Delete</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', function() {
      modal.style.display = 'none';
    });
    
    // Close on click outside the modal content
    window.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Update delete button action
  const deleteButton = modal.querySelector('#delete-btn');
  
  // Remove existing event listeners
  const newDeleteButton = deleteButton.cloneNode(true);
  deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);
  
  // Add new event listener
  newDeleteButton.addEventListener('click', function() {
    deleteMessage(messageId);
    modal.style.display = 'none';
  });
  
  // Show modal
  modal.style.display = 'block';
}

function updateMessage(messageId, newText) {
  fetch(`/api/messages/${messageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: newText }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update message in UI
        const messageElement = document.querySelector(`.message[data-id="${messageId}"] .message-text`);
        if (messageElement) {
          messageElement.textContent = newText;
          
          // Add edited label if not already present
          const messageContent = messageElement.closest('.message-content');
          if (messageContent) {
            if (!messageContent.querySelector('.edited-label')) {
              const editedLabel = document.createElement('span');
              editedLabel.className = 'edited-label';
              editedLabel.textContent = '(edited)';
              messageContent.appendChild(editedLabel);
            }
          }
        }
      } else {
        alert("Failed to update message. Please try again.");
      }
    })
    .catch(error => {
      alert("Failed to update message. Please try again.");
    });
}

function deleteMessage(messageId) {
  fetch(`/api/messages/${messageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove message from UI
        const messageElement = document.querySelector(`.message[data-id="${messageId}"]`);
        if (messageElement) {
          messageElement.remove();
        }
      } else {
        alert("Failed to delete message. Please try again.");
      }
    })
    .catch(error => {
      alert("Failed to delete message. Please try again.");
    });
}

// Open add contacts to group modal
function openAddToGroupModal(groupId) {
  // Initialize modal if it doesn't exist
  if (!document.getElementById("add-to-group-modal")) {
    createAddToGroupModalElement();
  }

  const modal = document.getElementById("add-to-group-modal");
  const errorMsg = document.getElementById("add-to-group-error");
  const contactsContainer = document.getElementById("contacts-to-add");

  // Reset error message
  errorMsg.textContent = "";

  // Set target group ID
  document.getElementById("target-group-id").value = groupId;

  // Clear search input
  document.getElementById("contact-search").value = "";

  // Load contacts for selection
  loadContactsForSelection(contactsContainer, true);

  // Show modal
  modal.style.display = "block";
}