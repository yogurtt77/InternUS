document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("pipedrive_api_token");
  localStorage.removeItem("pipedrive_domain");
  window.location.href = "auth.html";
});

const PIPEDRIVE_API_TOKEN = localStorage.getItem("pipedrive_api_token");
const PIPEDRIVE_DOMAIN = localStorage.getItem("pipedrive_domain");

// Проверяем авторизацию при загрузке
document.addEventListener("DOMContentLoaded", function () {
  if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_DOMAIN) {
    window.location.href = "auth.html";
    return;
  }
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
  alert("Информация сохранена в Local Storage!");
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
      const response = await createDealInPipedrive(formData);

      if (response.success) {
        alert("Заказ успешно создан в Pipedrive! ID: " + response.data.id);

        createJobBtn.textContent = "Request sent";
        createJobBtn.classList.add("sent-btn");

        document.querySelector(".form-container").style.display = "none";

        const successMessage = document.getElementById("job-success-message");
        successMessage.style.display = "block";

        const detailLink = document.getElementById("view-detail-link");
        detailLink.href = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/deal/${response.data.id}`;

        // Очищаем сохраненные данные после успешной отправки
        localStorage.removeItem("savedFormData");
      } else {
        alert(
          "Ошибка при создании заказа: " +
            (response.error || "Неизвестная ошибка")
        );
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert("Произошла ошибка: " + error.message);
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
    address: "e6bbf899ccbe6872cec83f3c7cb0f23c0d98273c",
    zip_code: "1ff4696467f6a1ddf972ad3c9e1e67b2c113e4f3",
    state: "bba723df7304e9c1ac612edc233aff42de063288",
    area: "e53c3604a74cc72a2ba88573a8c9cf62cc0b0b52",
    city: "0f638dda05d1df21ff801c095ea28efe9b5fa291",
    job_type: "4804591d9c41dbc38047bbc51dfaf2872cd8bd9b",
    job_source: "f075d56c57e4a56efd7e957c91bf332d2ce93ae0",
    job_description: "ffb3bf4cd25692b1ed77cd17f552f50b79d85ac8",
    start_time: "d578ada4791971a68e83fb8dcbfa31a472dbf329",
    end_time: "bb588da69cc3efbcbd273973b0f4844b47bdd0f7",
    test_select: "8f6c683e6c21971d87f423a54b70a5fec1b501c0",
    start_date: "46b53a486f2ac3f8f9bb80dccd4d6f1c42057d3e",
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
