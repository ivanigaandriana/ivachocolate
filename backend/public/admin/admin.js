const ordersUrl = "/api/orders";

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("orderModal");
  const modalContent = document.getElementById("orderDetails");
  const spanClose = document.querySelector(".close");

  // Закриття модалки
  spanClose.onclick = () => (modal.style.display = "none");
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
  };

  // Показ деталей замовлення
function showOrderDetails(order) {
  let html = `
    <p><strong>ID:</strong> ${order.id}</p>
    <p><strong>Клієнт:</strong> ${order.customer.name}</p>
    <p><strong>Телефон:</strong> ${order.customer.phone}</p>
    <p><strong>Email:</strong> ${order.customer.email || 'Не вказано'}</p>
    ${order.company ? `
  <hr>
  <p><strong>🏢 Дані компанії:</strong></p>
  <p>Назва: ${order.company.name || '-'}</p>
  <p>IČO: ${order.company.ico || '-'}</p>
  <p>DIČ: ${order.company.dic || '-'}</p>
  <p style="color:#0a7d2c;font-weight:600;">🔄 Замовлення оформлено на компанію</p>
` : ''}
    <p><strong>Сума:</strong> ${order.total} ${order.currency}</p>
    <p><strong>Статус:</strong> ${order.status}</p>
    <p><strong>Адреса доставки:</strong><br>
      ${order.customer.street || ''} ${order.customer.houseNumber || ''} ${order.customer.apartment ? 'кв. '+order.customer.apartment : ''}<br>
      ${order.customer.city || ''}, ${order.customer.postalIndex || ''}, ${order.customer.country || ''}<br>
    ${order.branch ? `<br><strong>📍 Пункт видачі:</strong><br>${order.branch}` : ''}
    </p>
    <p><strong>Доставка:</strong> ${order.delivery || 'Не вказано'}</p>
    <p><strong>Оплата:</strong> ${order.payment || 'Не вказано'}</p>
    <p><strong>Час:</strong> ${new Date(order.createdAt).toLocaleString('uk-UA')}</p>
    <h3>Товари:</h3>
    <ul>
  `;

  order.items.forEach(item => {
 if(item.type === 'custom_box'){
  html += `<li style="margin-bottom:10px;">
    <strong>🎁 ПОДАРУНКОВИЙ БОКС</strong><br>
    Назва: ${item.name}<br>
    Коробка: ${item.box_details?.box_name || ''} (${item.box_details?.capacity || ''})<br>
    Вміст (${item.box_details?.products?.length || 0} товарів):
    <ul style="margin:5px 0 5px 15px;">`;

  if(item.box_details?.products){
    item.box_details.products.forEach((p, index) => {
      html += `<li>${index+1}. ${p.product_name} - ${p.product_price} ${order.currency}</li>`;
    });
  }

  if(item.box_details?.card){
    html += `<li>Листівка: ${item.box_details.card.card_name} - ${item.box_details.card.card_price} ${order.currency}</li>`;
  }

      html += `
    </ul>
    <strong>Вартість боксу: ${item.price} ${order.currency}</strong>
  </li>`;
    } else {
      html += `<li>${item.name} x${item.quantity || 1} - ${item.price || 0} ${order.currency}</li>`;
    }
  });

  html += `</ul>`;
  modalContent.innerHTML = html;
  modal.style.display = "block";
}

  // Видалення замовлення
  function deleteOrder(id) {
    if(confirm("Видалити це замовлення?")){
      fetch(`${ordersUrl}/${id}`, { method: "DELETE" })
        .then(res => res.json())
        .then(data => {
          if(data.success){
            alert("✅ Замовлення видалено!");
            loadOrders();
          } else alert("❌ Помилка видалення");
        });
    }
  }

  // Зміна статусу
  function changeStatus(id, currentStatus) {
    const newStatus = prompt("Введіть новий статус:", currentStatus);
    if(newStatus){
      fetch(`${ordersUrl}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      .then(res => res.json())
      .then(data => {
        if(data.success){
          alert("✅ Статус оновлено");
          loadOrders();
        } else alert("❌ Помилка");
      });
    }
  }

  // Відображення таблиці
  function renderOrdersTable(orders) {
    const tbody = document.querySelector("#ordersTable tbody");
    tbody.innerHTML = "";

    orders.forEach(order => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${order.id}</td>
        <td>${order.customer.name}</td>
        <td>${order.total} ${order.currency}</td>
        <td>${order.status}</td>
        <td>
          <button class="btn-details">Деталі</button>
          <button class="btn-status">Статус</button>
          <button class="btn-delete">Видалити</button>
        </td>
      `;
      tbody.appendChild(tr);

      tr.querySelector(".btn-details").onclick = () => showOrderDetails(order);
      tr.querySelector(".btn-delete").onclick = () => deleteOrder(order.id);
      tr.querySelector(".btn-status").onclick = () => changeStatus(order.id, order.status);
    });
  }

  // Завантаження замовлень з сервера
  // function loadOrders() {
  //   fetch(ordersUrl)
  //     .then(res => res.json())
  //     .then(data => {
  //       if(data.success) renderOrdersTable(data.orders);
  //     });
  // }
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
const sortFilter = document.getElementById("sortFilter");
const applyFiltersBtn = document.getElementById("applyFilters");

let currentOrders = [];
function applyFilters() {
  let filtered = [...currentOrders]; // беремо глобальний масив

  // Фільтр за статусом
  const status = statusFilter.value;
  if (status !== "all") {
    filtered = filtered.filter(order => order.status === status);
  }

  // Пошук за ID або ім'ям
  const search = searchInput.value.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(order =>
      String(order.id).includes(search) ||
      (order.customer?.name || '').toLowerCase().includes(search)
    );
  }

  // Сортування
  const sort = sortFilter.value;
  if (sort === "date_desc") {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === "date_asc") {
    filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } else if (sort === "total_desc") {
    filtered.sort((a, b) => b.total - a.total);
  } else if (sort === "total_asc") {
    filtered.sort((a, b) => a.total - b.total);
  }

  renderOrdersTable(filtered);
}

// Кнопка "Застосувати"
applyFiltersBtn.onclick = () => applyFilters();


function loadOrders() {
  fetch(ordersUrl)
    .then(res => res.json())
    .then(data => {
      if(data.success){
        currentOrders = data.orders;
        applyFilters(); // відразу застосовуємо поточні фільтри
      }
    });
}

  // Ініціалізація
  loadOrders();
});