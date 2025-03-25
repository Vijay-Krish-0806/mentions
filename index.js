import { users } from "./users.js";
const dropdown = document.querySelector(".users-dropdown");
const commentField = document.querySelector(".comment-field");
const commentBtn = document.querySelector(".comment-button");
const showComments = document.querySelector(".show-comments");
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
function handleUsername(username) {
  let comment = commentField.innerHTML;
  let index = comment.lastIndexOf("@");
  //comment text before @ position
  const beforeAtPos = comment.substring(0, index);
  //comment text after @ position
  let afterCurPos = comment.substring(index + currentQuery.length + 1);
  //adding before + mention( a span here) + after
  commentField.innerHTML = `${beforeAtPos}<span contenteditable="false" class="mention">${username}</span>${afterCurPos}`;
  //after mentioning
  dropdown.style.display = "none";
  // Try to place cursor at the end of the inserted mention
  const range = document.createRange();
  const selection = window.getSelection();
  range.selectNodeContents(commentField);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
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
  commentTextDiv.innerHTML = "Comment: " + commentField.innerHTML.trim();
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
  if (!cursorInfo) return;
  const commentValue = commentField.textContent;
  const commentLength = commentValue.length;
  if (!commentValue) {
    dropdown.style.display = "none";
    return;
  }

  mentionStart = findMentionStartPosition(cursorInfo.text, cursorInfo.position);
  console.log(mentionStart);

  if (mentionStart >= 0) {
    const isAtStart = mentionStart === 0;
    const isAtEnd = mentionStart === commentLength - 1;
    // Use regex for consistent whitespace detection
    const hasSpaceBefore =
      isAtStart || /\s/.test(commentValue[mentionStart - 1]);

    if (isAtStart || isAtEnd || hasSpaceBefore) {
      // Extract query from @ to next space or end
      currentQuery = commentValue
        .substring(mentionStart + 1, cursorInfo.position)
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
