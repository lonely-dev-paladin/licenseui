const sidebar = document.getElementById("sidebar");
const menuBtn = document.querySelector(".menu-toggle");

function toggleSidebar() {
    sidebar.classList.toggle("open");
    document.body.classList.toggle("menu-open");
}

// click outside closes menu
document.addEventListener("click", function (e) {
    const clickedInsideSidebar = sidebar.contains(e.target);
    const clickedButton = menuBtn.contains(e.target);

    if (!clickedInsideSidebar && !clickedButton) {
        sidebar.classList.remove("open");
        document.body.classList.remove("menu-open");
    }
});

// clicking menu items closes sidebar
document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
        sidebar.classList.remove("open");
        document.body.classList.remove("menu-open");
    });
});

window.toggleSidebar = function () {
    sidebar.classList.toggle("open");
    document.body.classList.toggle("menu-open");
};