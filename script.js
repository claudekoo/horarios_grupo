const API_BASE_URL = 'https://horarios-grupo.onrender.com';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Initialize the grid
function initializeGrid() {
  const grid = document.querySelector('.time-grid');
  TIMES.forEach(time => {
    const timeLabel = createTimeLabel(time);
    grid.appendChild(timeLabel);
    DAYS.forEach(day => {
      const slot = createTimeSlot(day, time);
      grid.appendChild(slot);
    });
  });
}

// Create a time label element
function createTimeLabel(time) {
  const timeLabel = document.createElement('div');
  timeLabel.className = 'time-label';
  timeLabel.textContent = time;
  return timeLabel;
}

// Create a time slot element
function createTimeSlot(day, time) {
  const slot = document.createElement('div');
  slot.className = 'time-slot';
  slot.dataset.day = day;
  slot.dataset.time = time;
  slot.addEventListener('mousedown', startSelection);
  slot.addEventListener('mouseenter', continueSelection);
  slot.addEventListener('mouseup', endSelection);
  return slot;
}

// Variables to track selection
let isSelecting = false;
let startSlot = null;

// Start selection
function startSelection(event) {
  isSelecting = true;
  startSlot = event.target;
  startSlot.classList.toggle('selected');
}

// Continue selection
function continueSelection(event) {
  if (isSelecting) {
    event.target.classList.toggle('selected');
  }
}

// End selection
function endSelection(event) {
  isSelecting = false;
  startSlot = null;
}

// Open the modal
function openModal() {
  const modal = document.getElementById("availabilityModal");
  modal.style.display = "flex";
}

// Close the modal
function closeModal() {
  const modal = document.getElementById("availabilityModal");
  modal.style.display = "none";
}

// Handle form submission for availability
function handleAvailabilityFormSubmit(event) {
  event.preventDefault();
  const code = document.getElementById("code").value;
  const name = document.getElementById("name").value;
  const selectedTimes = collectSelectedTimes();
  submitAvailability(code, name, selectedTimes);
}

// Collect selected times from the grid
function collectSelectedTimes() {
  const selectedTimes = {};
  const selectedSlots = document.querySelectorAll('.time-slot.selected');
  selectedSlots.forEach(slot => {
    const day = slot.dataset.day;
    const time = slot.dataset.time;
    if (!selectedTimes[day]) {
      selectedTimes[day] = [];
    }
    selectedTimes[day].push(time);
  });
  return selectedTimes;
}

// Submit availability to the backend
function submitAvailability(code, name, times) {
  fetch(`${API_BASE_URL}/submit-availability`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, name, times })
  })
  .then(response => response.json())
  .then(data => {
    alert('Availability submitted successfully!');
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error submitting availability.');
  });
}

// Handle form submission for checking availability
function handleCheckAvailabilityFormSubmit(event) {
  event.preventDefault();
  const code = document.getElementById("groupCode").value;
  checkAvailability(code);
}

// Check availability from the backend
function checkAvailability(code) {
  fetch(`${API_BASE_URL}/get-availability/${code}`)
    .then(response => {
      if (response.status === 404) {
        throw new Error('404 Not Found');
      }
      return response.json();
    })
    .then(data => {
      displayAvailability(data);
    })
    .catch(error => {
      console.error('Error:', error);
      displayNotFoundMessage();
    });
}

// Display availability in the grid
function displayAvailability(data) {
  const grid = document.getElementById("availabilityGrid");
  grid.innerHTML = ''; 
  if (data.length === 0) {
    displayNoDataMessage(grid);
    return;
  }
  const timeCounts = countAvailability(data);
  createAvailabilityTable(timeCounts, data.length);
}

// Count availability for each time slot
function countAvailability(data) {
  const timeCounts = {};
  data.forEach(entry => {
    for (const [day, times] of Object.entries(entry.times)) {
      times.forEach(time => {
        if (!timeCounts[day]) {
          timeCounts[day] = {};
        }
        if (!timeCounts[day][time]) {
          timeCounts[day][time] = 0;
        }
        timeCounts[day][time]++;
      });
    }
  });
  return timeCounts;
}

// Display a "No availability found" message
function displayNoDataMessage(grid) {
  const noDataMessage = document.createElement("p");
  noDataMessage.textContent = 'No availability found for this code.';
  grid.appendChild(noDataMessage);
}

// Display a "Not Found" message
function displayNotFoundMessage() {
  const grid = document.getElementById("availabilityGrid");
  grid.innerHTML = ''; 
  const notFoundMessage = document.createElement("p");
  notFoundMessage.textContent = 'Código no encontrado.';
  grid.appendChild(notFoundMessage);
}

// Create the availability table
function createAvailabilityTable(timeCounts, totalPeople) {
  const grid = document.getElementById("availabilityGrid");
  const headerRow = createHeaderRow();
  grid.appendChild(headerRow);
  TIMES.forEach(timeSlot => {
    const row = createTimeSlotRow(timeSlot, timeCounts, totalPeople);
    grid.appendChild(row);
  });
}

// Create the header row for the availability table
function createHeaderRow() {
  const headerRow = document.createElement("tr");
  const emptyHeader = document.createElement("th");
  headerRow.appendChild(emptyHeader);
  const dayAbbreviations = {
    Monday: "Lu",
    Tuesday: "Ma",
    Wednesday: "Mi",
    Thursday: "Ju",
    Friday: "Vi",
    Saturday: "Sa",
    Sunday: "Do"
  };
  DAYS.forEach(day => {
    const dayHeader = document.createElement("th");
    dayHeader.textContent = dayAbbreviations[day] || day;
    headerRow.appendChild(dayHeader);
  });
  return headerRow;
}

// Create a row for a time slot in the availability table
function createTimeSlotRow(timeSlot, timeCounts, totalPeople) {
  const row = document.createElement("tr");
  const timeCell = document.createElement("td");
  timeCell.textContent = timeSlot;
  row.appendChild(timeCell);
  DAYS.forEach(day => {
    const cell = createAvailabilityCell(day, timeSlot, timeCounts, totalPeople);
    row.appendChild(cell);
  });
  return row;
}

// Create a cell for a time slot in the availability table
function createAvailabilityCell(day, timeSlot, timeCounts, totalPeople) {
  const cell = document.createElement("td");
  cell.dataset.day = day;
  cell.dataset.time = timeSlot;
  const count = (timeCounts[day] && timeCounts[day][timeSlot]) || 0;
  const percentage = (count / totalPeople) * 100;
  const darkness = Math.min(percentage, 100);
  cell.style.backgroundColor = `rgba(32, 116, 30, ${darkness / 100})`;
  if (count > 0) {
    cell.textContent = count;
  }
  return cell;
}

// Event listeners
document.getElementById("openModalBtn").addEventListener("click", openModal);
document.getElementsByClassName("close-modal")[0].addEventListener("click", closeModal);
window.addEventListener("click", function(event) {
  if (event.target == document.getElementById("availabilityModal")) {
    closeModal();
  }
});
document.getElementById("availabilityForm").addEventListener("submit", handleAvailabilityFormSubmit);
document.getElementById("checkAvailabilityForm").addEventListener("submit", handleCheckAvailabilityFormSubmit);

// Initialize the grid on page load
initializeGrid();