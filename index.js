import { users } from "./users.js";
const dropdown = document.querySelector(".users-dropdown");
const commentField = document.querySelector(".comment-field");
const commentBtn = document.querySelector(".comment-button");
const showComments = document.querySelector(".showComments");

// Set initial focus
commentField.focus();

// State tracking variables
let selectedIndex = -1;
let mentionStart = -1;
let currentQuery = "";

function makeDropDown(usersList) {
  dropdown.innerHTML = "";
  selectedIndex = -1;

  usersList.forEach((user, i) => {
    const li = document.createElement("li");
    const img = document.createElement("img");

    img.src = user.userImg;
    img.alt = `${user.username} avatar`;

    li.classList.add("list-item");
    li.appendChild(img);
    li.appendChild(document.createTextNode(`${user.username}`));
    li.dataset.index = i;

    dropdown.append(li);
  });
}

function saveCursorPosition() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(commentField);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return {
      text: preCaretRange.toString(),
      position: preCaretRange.toString().length,
      range: range,
    };
  }
  return null;
}

function calculateCaretCoords() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return { top: 0, left: 0 };

  const range = selection.getRangeAt(0).cloneRange();
  const tempSpan = document.createElement("span");
  tempSpan.textContent = "@";
  range.insertNode(tempSpan);

  const rect = tempSpan.getBoundingClientRect();
  tempSpan.parentNode.removeChild(tempSpan);
  const fieldRect = commentField.getBoundingClientRect();

  return {
    top: `${rect.top - fieldRect.top - dropdown.offsetHeight - 10}px`,
    left: `${rect.left - fieldRect.left - 25}px`,
  };
}

function findMentionStartPosition(text, cursorPosition) {
  for (let i = cursorPosition - 1; i >= 0; i--) {
    if (text[i] === "@") {
      return i;
    } else if (text[i] === " " || text[i] === "\n") {
      break;
    }
  }
  return -1;
}

function highlightSelectedItem(items) {
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add("selected");
      ensureItemIsVisible(item);
    } else {
      item.classList.remove("selected");
    }
  });
}

function ensureItemIsVisible(selectedItem) {
  const dropdownRect = dropdown.getBoundingClientRect();
  const itemRect = selectedItem.getBoundingClientRect();

  if (itemRect.top < dropdownRect.top) {
    dropdown.scrollTop += itemRect.top - dropdownRect.top;
  } else if (itemRect.bottom > dropdownRect.bottom) {
    dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom;
  }
}

function handleUsername(username) {
  let comment = commentField.innerHTML;
  let index = comment.lastIndexOf("@");

  // Only replace the @query part, not everything after it
  const beforeAtPos = comment.substring(0, index);
  let afterCurPos = comment.substring(index + currentQuery.length + 1);

  commentField.innerHTML = `${beforeAtPos}<span contenteditable="false" class="mention">${username}</span> ${afterCurPos}`;
  dropdown.style.display = "none";

  // Set focus back to comment field
  commentField.focus();

  // Try to place cursor at the end of the inserted mention
  const selection = window.getSelection();
  const range = document.createRange();
  const mentions = commentField.querySelectorAll(".mention");

  // Find the mention we just added (likely the last one)
  if (mentions.length > 0) {
    const lastMention = mentions[mentions.length - 1];
    range.setStartAfter(lastMention);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function handleComment(event) {
  if (!commentField.innerHTML.trim()) {
    commentField.innerHTML = `Please comment something!!`;
    setTimeout(() => {
      commentField.innerHTML = "";
    }, 1500);
    return;
  }

  const div = document.createElement("div");
  div.classList.add("individual-comment");

  // Get current date
  const today = new Date();
  const dateOnly = today.toLocaleDateString();

  // Extract mentions from spans (avoiding duplicates)
  const mentions = new Set();
  commentField.querySelectorAll(".mention").forEach((mention) => {
    mentions.add(mention.textContent.trim());
  });

  // Create elements for structured comment
  const commenterDiv = document.createElement("div");
  const img = document.createElement("img");
  img.src = "boy.png";
  img.alt = `My avatar`;
  commenterDiv.appendChild(img);
  const textNode = document.createTextNode(`Vijay - ${dateOnly}`);

  commenterDiv.appendChild(textNode);
  commenterDiv.classList.add("commenter-info");

  commenterDiv.textNode = `Vijay - ${dateOnly}`;

  const mentionsDiv = document.createElement("div");
  mentionsDiv.classList.add("mentions-list");
  mentionsDiv.textContent =
    mentions.size > 0
      ? `Mentions: ${[...mentions].join(", ")}`
      : "Mentions: None";

  const commentTextDiv = document.createElement("div");
  commentTextDiv.classList.add("comment-text");
  commentTextDiv.innerHTML = "Comment: " + commentField.innerHTML;

  div.appendChild(commenterDiv);
  div.appendChild(mentionsDiv);
  div.appendChild(commentTextDiv);

  // Append comment to the comment section
  showComments.appendChild(div);

  // Clear comment field and reset
  commentField.innerHTML = "";
  commentField.focus();
}

// Initialize dropdown with all users
makeDropDown(users);

// EVENT HANDLERS
commentField.addEventListener("input", function (e) {
  const cursorInfo = saveCursorPosition();
  if (!cursorInfo) return;

  const value = commentField.textContent;
  if (!value) {
    dropdown.style.display = "none";
    return;
  }

  // Find @ before cursor
  mentionStart = findMentionStartPosition(cursorInfo.text, cursorInfo.position);

  if (mentionStart >= 0) {
    // Get query text after @
    currentQuery = cursorInfo.text
      .substring(mentionStart + 1, cursorInfo.position)
      .toLowerCase()
      .trim();

    if (mentionStart === cursorInfo.position - 1 || currentQuery) {
      // Filter users based on query
      const filteredUsers = users.filter((user) =>
        user.username.toLowerCase().includes(currentQuery)
      );

      if (filteredUsers.length > 0) {
        makeDropDown(filteredUsers);
        dropdown.style.display = "block";
        const { top, left } = calculateCaretCoords();
        dropdown.style.position = "absolute";
        dropdown.style.top = top;
        dropdown.style.left = left;
      } else {
        dropdown.style.display = "none";
      }
    }
  } else {
    dropdown.style.display = "none";
  }
});

// Keyboard navigation for dropdown
commentField.addEventListener("keydown", function (e) {
  if (dropdown.style.display === "block") {
    const items = dropdown.querySelectorAll(".list-item");
    if (items.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        highlightSelectedItem(items);
        break;

      case "ArrowUp":
        e.preventDefault();
        selectedIndex =
          selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        highlightSelectedItem(items);
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const username = items[selectedIndex].textContent.trim();
          handleUsername(username);
        } else if (items.length > 0) {
          const username = items[0].textContent.trim();
          handleUsername(username);
        }
        break;

      case "Escape":
        e.preventDefault();
        dropdown.style.display = "none";
        break;
    }
  }
});

dropdown.addEventListener("click", function (event) {
  const listItem = event.target.closest(".list-item");
  if (!listItem) return;

  const username = listItem.textContent.trim();
  handleUsername(username);
});

commentBtn.addEventListener("click", handleComment);
