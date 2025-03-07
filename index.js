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

//initial function to make dropdown for all available users
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
makeDropDown(users);

//li elements of all users for filtering further
const usersList = document.querySelectorAll(".users-dropdown li");

//to know cursor pointer position and text
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

//to find starting position of @
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

//to highlight selected items from dropdown
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

//to make scroll when keydown/up whenever needed
function ensureItemIsVisible(selectedItem) {
  const dropdownRect = dropdown.getBoundingClientRect();
  const itemRect = selectedItem.getBoundingClientRect();

  if (itemRect.top < dropdownRect.top) {
    dropdown.scrollTop += itemRect.top - dropdownRect.top;
  } else if (itemRect.bottom > dropdownRect.bottom) {
    dropdown.scrollTop += itemRect.bottom - dropdownRect.bottom;
  }
}

//after clicking the mention in dropdown, to handle that "mention" (highlighting)
  // Get the current content
function handleUsername(username){
  const fullContent = commentField.innerHTML;

  // Get the current selection and cursor position
  const cursorInfo = saveCursorPosition();
  if (!cursorInfo) return;

  // Split the content precisely at the mention start position
  const beforeMention = fullContent.substring(0, mentionStart);
  const afterMentionStart = fullContent.substring(mentionStart);

  // Check if there's any content after the @ symbol
  const queryLength = currentQuery.length;

  // Find where the query portion ends in the afterMentionStart
  // This is more precise than a simple replace which might affect emails
  let endOfMention = mentionStart + 1 + queryLength; // +1 for the @ symbol

  // Extract the exact string we need to replace
  const exactReplacement = fullContent.substring(mentionStart, endOfMention);

  // Create the new content by careful replacement
  let newContent = beforeMention;
  newContent += `<span contenteditable="false" class="mention">${username}</span> `;
  newContent += fullContent.substring(endOfMention);

  // Update the content
  commentField.innerHTML = newContent;

  // Hide dropdown
  dropdown.style.display = "none";

  // Calculate the new cursor position - right after the inserted mention
  const cursorPos = beforeMention.length + 
    `<span contenteditable="false" class="mention">${username}</span> `.length;
  dropdown.style.display = "none";
  
  // Place cursor at the end
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(commentField);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Reset mention tracking variables
  mentionStart = -1;
  currentQuery = "";
}

//to display the typed comment below
function handleComment(event) {
  //if comment field is empty return
  if (!commentField.innerHTML.trim()) {
    commentField.innerHTML = `Please comment something!!`;
    setTimeout(() => {
      commentField.innerHTML = "";
    }, 1500);
    return;
  }

  const div = document.createElement("div");
  div.classList.add("individual-comment");

  //date- to know when comment is created
  const today = new Date();
  const dateOnly = today.toLocaleDateString();

  // Extract mentions from spans (avoiding duplicates) (to show all mentions)
  const mentions = new Set();
  commentField.querySelectorAll(".mention").forEach((mention) => {
    mentions.add(mention.textContent.trim());
  });

  // Create different elements for structured comment

  //this is to know who actually commented (in this case me )
  const commenterDiv = document.createElement("div");
  const img = document.createElement("img");
  img.src = "boy.png";
  img.alt = `My avatar`;
  commenterDiv.appendChild(img);
  const textNode = document.createTextNode(`Vijay - ${dateOnly}`);
  commenterDiv.appendChild(textNode);
  commenterDiv.classList.add("commenter-info");
  commenterDiv.textNode = `Vijay - ${dateOnly}`;

  // to show all mentions
  const mentionsDiv = document.createElement("div");
  mentionsDiv.classList.add("mentions-list");
  mentionsDiv.textContent =
    mentions.size > 0
      ? `Mentions: ${[...mentions].join(", ")}`
      : "Mentions: None";

  // to show actual comment
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

// EVENT HANDLERS

//cpmment field event (input)
commentField.addEventListener("input", function (e) {
  const cursorInfo = saveCursorPosition();
  // console.log(cursorInfo);
  if (!cursorInfo) return;

  const commentValue = commentField.textContent;
  const commentLength = commentValue.length;
  if (!commentValue) {
    dropdown.style.display = "none";
    return;
  }

  mentionStart = findMentionStartPosition(cursorInfo.text, cursorInfo.position);

  if (mentionStart >= 0) {
    const isAtStart = mentionStart === 0;
    const isAtEnd = mentionStart === commentLength - 1;

    // Use regex for consistent whitespace detection
    const hasSpaceBefore =
      isAtStart || /\s/.test(commentValue[mentionStart - 1]);

    // Check if cursor is right after @ or if we have a query
    const isCursorAfterAt = cursorInfo.position > mentionStart;

    if (isAtStart || isAtEnd || hasSpaceBefore) {
      // Find the next space after the cursor position
      const nextSpaceIndex = commentValue.indexOf(" ", mentionStart + 1);
      const endPosition =
        nextSpaceIndex === -1 ? commentLength : nextSpaceIndex;

      // Extract query from @ to next space or end
      currentQuery = commentValue
        .substring(mentionStart + 1, endPosition)
        .toLowerCase()
        .trim();

      let hasMatches = false;

      usersList.forEach((user) => {
        const match = user.textContent.toLowerCase().includes(currentQuery);
        user.style.display = match ? "flex" : "none";
        if (match) hasMatches = true;
      });

      dropdown.style.display = hasMatches ? "block" : "none";
    } else {
      dropdown.style.display = "none";
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

      //to close dropdown when Escape key is pressed
      case "Escape":
        e.preventDefault();
        dropdown.style.display = "none";
        break;
    }
  }
});

//event deligation on dropdown so when user clicks on li it gets mentioned
dropdown.addEventListener("click", function (event) {
  const listItem = event.target.closest(".list-item");
  if (!listItem) return;

  const username = listItem.textContent.trim();
  handleUsername(username);
});

//when comment button is clicked
commentBtn.addEventListener("click", handleComment);

//to close dropdown when user clicks outside of dropdown
function closeDropdown() {
  dropdown.style.display = "none";
  // document.removeEventListener("click", handleClickOutside);
}
document.addEventListener("click", function (event) {
  if (
    !dropdown.contains(event.target) &&
    !commentField.contains(event.target)
  ) {
    closeDropdown();
  }
});

// function calculateCaretCoords() {
//   const selection = window.getSelection();
//   if (selection.rangeCount === 0) return { top: 0, left: 0 };

//   const range = selection.getRangeAt(0).cloneRange();
//   const tempSpan = document.createElement("span");
//   tempSpan.textContent = "@";
//   range.insertNode(tempSpan);

//   const rect = tempSpan.getBoundingClientRect();
//   tempSpan.parentNode.removeChild(tempSpan);
//   const fieldRect = commentField.getBoundingClientRect();

//   return {
//     top: `${rect.top - fieldRect.top - dropdown.offsetHeight - 10}px`,
//     left: `${rect.left - fieldRect.left - 25}px`,
//   };
// }
