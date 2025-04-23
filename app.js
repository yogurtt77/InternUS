// Remove logout button event listener and replace with token and domain config
// Get token and domain from window variables set in index.html
const PIPEDRIVE_API_TOKEN = window.PIPEDRIVE_API_TOKEN;
const PIPEDRIVE_DOMAIN = window.PIPEDRIVE_DOMAIN;

// Get SDK instance if available
const sdk = window.pipedriveSDK;

// Set up SDK event listeners if SDK is available
if (sdk) {
  // Listen for visibility changes
  sdk.listen(Event.VISIBILITY, ({ error, data }) => {
    if (error) {
      console.error('Visibility event error:', error);
      return;
    }
    
    console.log('Visibility changed:', data.is_visible);
    // You could update UI based on visibility state
  });
  
  // Listen for page visibility state changes
  sdk.listen(Event.PAGE_VISIBILITY_STATE, ({ data }) => {
    console.log('Page visibility state:', data.state);
    // You could pause/resume operations based on page visibility
  });
}

// Removed the auth check, just load saved form data if available
document.addEventListener("DOMContentLoaded", function () {
  const savedData = localStorage.getItem("savedFormData");
  if (savedData) {
    const formData = JSON.parse(savedData);

    document.getElementById("firstName").value =
      formData.client.firstName || "";
    document.getElementById("lastName").value = formData.client.lastName || "";
    document.getElementById("phone").value = formData.client.phone || "";
    document.getElementById("email").value = formData.client.email || "";

    document.getElementById("jobType").value = formData.job.type || "";
    document.getElementById("jobSource").value = formData.job.source || "";
    document.getElementById("jobDescription").value =
      formData.job.description || "";

    document.getElementById("address").value = formData.location.address || "";
    document.getElementById("zipCode").value = formData.location.zipCode || "";
    document.getElementById("state").value = formData.location.state || "";
    document.getElementById("area").value = formData.location.area || "";
    document.getElementById("city").value = formData.location.city || "";

    document.getElementById("startDate").value =
      formData.schedule.startDate || "";
    document.getElementById("startTime").value =
      formData.schedule.startTime || "";
    document.getElementById("endTime").value = formData.schedule.endTime || "";
    document.getElementById("testSelect").value =
      formData.schedule.testSelect || "";
  }
});

// Обработчик для кнопки Save info
document.getElementById("saveBtn").addEventListener("click", function () {
  const formData = {
    client: {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value || null,
    },
    job: {
      type: document.getElementById("jobType").value,
      source: document.getElementById("jobSource").value,
      description: document.getElementById("jobDescription").value || null,
    },
    location: {
      address: document.getElementById("address").value,
      zipCode: document.getElementById("zipCode").value,
      state: document.getElementById("state").value,
      area: document.getElementById("area").value,
      city: document.getElementById("city").value,
    },
    schedule: {
      startDate: document.getElementById("startDate").value,
      startTime: document.getElementById("startTime").value,
      endTime: document.getElementById("endTime").value,
      testSelect: document.getElementById("testSelect").value,
    },
  };

  localStorage.setItem("savedFormData", JSON.stringify(formData));
  
  // Show snackbar notification using Pipedrive SDK if available
  if (sdk) {
    sdk.execute(Command.SHOW_SNACKBAR, {
      message: 'Information saved successfully',
    });
  } else {
    alert("Информация сохранена в Local Storage!");
  }
});

// Обработчик отправки формы
document
  .getElementById("jobForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const createJobBtn = document.getElementById("createJobBtn");

    const formData = {
      client: {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value || null,
      },
      job: {
        type: document.getElementById("jobType").value,
        source: document.getElementById("jobSource").value,
        description: document.getElementById("jobDescription").value || null,
      },
      location: {
        address: document.getElementById("address").value,
        zipCode: document.getElementById("zipCode").value,
        state: document.getElementById("state").value,
        area: document.getElementById("area").value,
        city: document.getElementById("city").value,
      },
      schedule: {
        startDate: document.getElementById("startDate").value,
        startTime: document.getElementById("startTime").value,
        endTime: document.getElementById("endTime").value,
        testSelect: document.getElementById("testSelect").value,
      },
    };

    try {
      // Show confirmation dialog using SDK if available
      let shouldProceed = true;
      if (sdk) {
        const { confirmed } = await sdk.execute(Command.SHOW_CONFIRMATION, {
          title: 'Create Job',
          description: 'Are you sure you want to create this job?',
          okText: 'Create',
          cancelText: 'Cancel'
        });
        shouldProceed = confirmed;
      }

      if (!shouldProceed) return;

      const response = await createDealInPipedrive(formData);

      if (response.success) {
        if (sdk) {
          sdk.execute(Command.SHOW_SNACKBAR, {
            message: "Заказ успешно создан в Pipedrive!",
            link: {
              url: `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/deal/${response.data.id}`,
              label: "View Deal"
            }
          });
        } else {
          alert("Заказ успешно создан в Pipedrive! ID: " + response.data.id);
        }

        createJobBtn.textContent = "Request sent";
        createJobBtn.classList.add("sent-btn");

        document.querySelector(".form-container").style.display = "none";

        const successMessage = document.getElementById("job-success-message");
        successMessage.style.display = "block";

        const detailLink = document.getElementById("view-detail-link");
        detailLink.href = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/deal/${response.data.id}`;
        detailLink.setAttribute("data-deal-id", response.data.id);

        // Очищаем сохраненные данные после успешной отправки
        localStorage.removeItem("savedFormData");
      } else {
        if (sdk) {
          sdk.execute(Command.SHOW_SNACKBAR, {
            message: "Ошибка при создании заказа: " + (response.error || "Неизвестная ошибка")
          });
        } else {
          alert(
            "Ошибка при создании заказа: " +
              (response.error || "Неизвестная ошибка")
          );
        }
      }
    } catch (error) {
      console.error("Ошибка:", error);
      if (sdk) {
        sdk.execute(Command.SHOW_SNACKBAR, {
          message: "Произошла ошибка: " + error.message
        });
      } else {
        alert("Произошла ошибка: " + error.message);
      }
    }
  });

// Валидация формы
function validateForm(formData) {
  const requiredFields = [
    formData.client.firstName,
    formData.client.lastName,
    formData.client.phone,
    formData.client.email,
    formData.job.type,
    formData.job.source,
    formData.location.address,
    formData.location.zipCode,
    formData.location.state,
    formData.location.area,
    formData.location.city,
    formData.schedule.startDate,
    formData.schedule.startTime,
    formData.schedule.endTime,
    formData.schedule.testSelect,
  ];

  return requiredFields.every((field) => field && field.trim() !== "");
}

// Создание сделки в Pipedrive
async function createDealInPipedrive(formData) {
  const FIELD_KEYS = {
    address: "decfa0efbb5427ddf48b33d820acafac4c2ef524",
    zip_code: "7c042d1e91f67b0459344fcac54132aadbb05ee1",
    state: "f56c6f24155457018747e688de459cee7e2200dc",
    area: "23fa3eb4cafceee466cc6b98ff628ab61fc42a47",
    city: "b5bf86512779a505fa0cef05bdb6a5022f72122d",
    job_type: "ac5596f02cec0d0fa2b12f0c36bd948a7eb603ff",
    job_source: "541fa21f9e64ccabf7e9a35a1522da1d8b278ea3",
    job_description: "ab1dfe989bc32cdfe69b922a126fae4d9a6060cc",
    start_time: "a6988f2e7c89083939bed32348d14f1cf368a3ba",
    end_time: "4810b0ac4ccf006a123debe8b173b259899a41ff",
    test_select: "52c033065a9009cb1135058177cafb1d65f099a9",
    start_date: "d5dcd7449d67827fc44516abfa009699ad200465",
  };

  const dealData = {
    title: `Заказ от ${formData.client.firstName} ${formData.client.lastName}`,
    person_id: await createPersonInPipedrive(formData.client),
    [FIELD_KEYS.address]: formData.location.address,
    [FIELD_KEYS.zip_code]: formData.location.zipCode,
    [FIELD_KEYS.state]: formData.location.state,
    [FIELD_KEYS.area]: formData.location.area,
    [FIELD_KEYS.city]: formData.location.city,
    [FIELD_KEYS.job_type]: formData.job.type,
    [FIELD_KEYS.job_source]: formData.job.source,
    [FIELD_KEYS.job_description]: formData.job.description,
    [FIELD_KEYS.start_time]: formData.schedule.startTime,
    [FIELD_KEYS.end_time]: formData.schedule.endTime,
    [FIELD_KEYS.test_select]: formData.schedule.testSelect,
    [FIELD_KEYS.start_date]: formData.schedule.startDate,
    expected_close_date: formData.schedule.startDate,
  };

  try {
    const response = await fetch(
      `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/deals?api_token=${PIPEDRIVE_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealData),
      }
    );

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, error: error.message };
  }
}

// Создание контакта (персоны) в Pipedrive
async function createPersonInPipedrive(clientData) {
  const personData = {
    name: `${clientData.firstName} ${clientData.lastName}`,
    phone: [{ value: clientData.phone, primary: true }],
    email: clientData.email ? [{ value: clientData.email, primary: true }] : [],
  };

  try {
    const response = await fetch(
      `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1/persons?api_token=${PIPEDRIVE_API_TOKEN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(personData),
      }
    );

    const result = await response.json();
    return result.data?.id || null;
  } catch (error) {
    console.error("Error creating person:", error);
    return null;
  }
}

// Function to open deal in Pipedrive using SDK
async function openDealInPipedrive(dealId) {
  if (!sdk) return;
  
  try {
    await sdk.execute(Command.REDIRECT_TO, { 
      view: View.DEALS, 
      id: dealId 
    });
  } catch (error) {
    console.error('Failed to open deal:', error);
  }
}

// Add a click handler to the view detail link to use SDK redirect
document.addEventListener("DOMContentLoaded", function() {
  const viewDetailLink = document.getElementById("view-detail-link");
  if (viewDetailLink && sdk) {
    viewDetailLink.addEventListener("click", function(e) {
      const dealId = this.getAttribute("data-deal-id");
      if (dealId) {
        e.preventDefault();
        openDealInPipedrive(dealId);
      }
    });
  }
});
