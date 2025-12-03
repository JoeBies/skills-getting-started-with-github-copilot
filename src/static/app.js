document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear activity select options (keep a placeholder)
      activitySelect.innerHTML = '<option value="">Choose an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants?.length || 0);

        // Build participants markup
        const participants = details.participants || [];
        let participantsHtml = `<div class="participants"><h5>Participants</h5>`;

        if (participants.length === 0) {
          participantsHtml += `<div class="empty">No participants yet</div>`;
        } else {
          participantsHtml += `<ul>`;
          participants.forEach((p) => {
            // derive simple initials from the local-part of an email or a name-like string
            const local = (p.split && p.split("@")[0]) || String(p);
            const initials = local
              .split(/[\.\-_ ]+/)
              .map((s) => (s ? s[0].toUpperCase() : ""))
              .join("")
              .slice(0, 2);
            participantsHtml += `<li><span class="avatar">${initials}</span><span class="p-name">${p}</span><span class="delete-icon" title="Remove participant" data-activity="${name}" data-email="${p}">&#128465;</span></li>`;
          });
          participantsHtml += `</ul>`;
        }
        participantsHtml += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so participant lists update
        fetchActivities();
        // Handle participant delete (unregister)
        activitiesList.addEventListener("click", async (event) => {
          const target = event.target;
          if (target.classList.contains("delete-icon")) {
            const activity = target.getAttribute("data-activity");
            const email = target.getAttribute("data-email");
            if (!activity || !email) return;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                method: "POST"
              });
              const result = await response.json();
              if (response.ok) {
                messageDiv.textContent = result.message || "Participant removed.";
                messageDiv.className = "success";
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Failed to remove participant.";
                messageDiv.className = "error";
              }
              messageDiv.classList.remove("hidden");
              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 4000);
            } catch (error) {
              messageDiv.textContent = "Error removing participant.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          }
        });
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
