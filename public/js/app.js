let subMenu = document.querySelector(".profile-link");
let imgPro = document.getElementById("img-pro");
const overlay = document.querySelector(".overlay");
document.addEventListener("DOMContentLoaded", () => {
  function toggleMenu(e) {
    e.stopPropagation();
    // subMenu.classList.remove("hidden");
    subMenu.classList.toggle("show");
  }
  if (imgPro) {
    imgPro.addEventListener("click", toggleMenu);
    overlay.addEventListener("click", toggleMenu);
    document.addEventListener("click", function () {
      if (subMenu.classList.contains("show")) {
        subMenu.classList.remove("show");
      }
    });
  }
});

const primaryNav = document.querySelector(".primary-navigation");
const navToggle = document.querySelector(".mobile-nav-toggle");
function togglePrimaryNav() {
  const visibility = primaryNav.getAttribute("data-visible");
  if (visibility === "false") {
    overlay.classList.remove("hidden");
    primaryNav.setAttribute("data-visible", true);
    navToggle.setAttribute("aria-expanded", true);
  } else {
    overlay.classList.add("hidden");
    primaryNav.setAttribute("data-visible", false);
    navToggle.setAttribute("aria-expanded", false);
  }
}

if (navToggle) {
  navToggle.addEventListener("click", togglePrimaryNav);
  overlay.addEventListener("click", () => {
    const visibility = primaryNav.getAttribute("data-visible");
    if (visibility === "false") {
      overlay.classList.remove("hidden");
    } else {
      overlay.classList.add("hidden");
      primaryNav.setAttribute("data-visible", false);
      navToggle.setAttribute("aria-expanded", false);
    }
  });
}
const modal = document.querySelector(".modal");

const openModalBtn = document.querySelectorAll(".btn-open");
const openModalId = document.querySelector(".btn-open");
const closeModalBtn = document.querySelectorAll(".btn-close");

const openModal = function () {
  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");
};

const closeModal = function () {
  modal.classList.add("hidden");
  overlay.classList.add("hidden");
};
if (openModalId) {
  openModalBtn.forEach((el) => el.addEventListener("click", openModal));
  closeModalBtn.forEach((el) => el.addEventListener("click", closeModal));
  overlay.addEventListener("click", closeModal);
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) {
    modalClose();
  }
});

let cancel = document.querySelector(".cancel");
if (cancel) {
  cancel.addEventListener("click", () => {
    location.href = "/home";
  });
}

let toast = document.querySelector(".toast");
if (toast) {
  setTimeout(() => {
    toast.classList.remove("show");
    toast.parentNode.style.display = "none";
  }, 3000);
}

let searchBtn = document.querySelector(".searchBtn");
let search = document.querySelector(".searchField");

if (search) {
  searchBtn.disabled = true;
  search.addEventListener("keyup", buttonState);

  function buttonState() {
    if (search.value === "" || search.value.length === 1) {
      searchBtn.disabled = true; // return disabled as true whenever the input field is empty
    } else {
      searchBtn.disabled = false; // enable the button once the input field has content
    }
  }
}
