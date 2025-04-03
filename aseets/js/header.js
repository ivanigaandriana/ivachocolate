document.addEventListener("DOMContentLoaded", function() {
    fetch("../components/header.html") // Шлях до хедера
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        })
        .catch(error => console.error("Помилка завантаження хедера:", error));
});