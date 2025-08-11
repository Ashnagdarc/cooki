const searchForm = document.getElementById("search-form");
const searchResultDiv = document.getElementById("search-result");
const container = document.querySelector(".container");
let searchQuery = "";

// Modal elements
const modal = document.getElementById("recipe-modal");
const modalTitle = document.getElementById("modal-title");
const modalImg = document.getElementById("modal-img");
const modalCalories = document.getElementById("modal-calories");
const modalDetails = document.getElementById("modal-details");
const closeBtn = document.querySelector(".close-btn");

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchQuery = document.getElementById("search-input").value.trim();
  if (searchQuery.length === 0) {
    searchResultDiv.innerHTML = '<p style="color:#ff7e5f;text-align:center;">Please enter a search term.</p>';
    return;
  }
  fetchMealDB();
});

async function fetchMealDB() {
  try {
    const baseURL = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(baseURL);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    if (!data.meals) {
      searchResultDiv.innerHTML = '<p style="color:#ff7e5f;text-align:center;">No recipes found. Try another search!</p>';
      return;
    }
    generateMealDBHTML(data.meals);
  } catch (err) {
    searchResultDiv.innerHTML = `<p style='color:#ff7e5f;text-align:center;'>Error: ${err.message}</p>`;
  }
}

function generateMealDBHTML(results) {
  container.classList.remove("initial");
  let generatedHTML = "";
  results.forEach((meal, idx) => {
    generatedHTML +=
    `
    <div class="item card" data-idx="${idx}">
        <img src="${meal.strMealThumb}" alt="img" class="recipe-img">
        <div class="flex-container">
          <h1 class="title">${meal.strMeal}</h1>
          <button class="view-button" data-idx="${idx}">View Recipe</button>
        </div>
        <p class="item-data">Category: ${meal.strCategory || 'N/A'}</p>
        <p class="item-data">Area: ${meal.strArea || 'N/A'}</p>
    </div>
    `;
  });
  searchResultDiv.innerHTML = generatedHTML;

  document.querySelectorAll(".view-button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const idx = e.target.getAttribute("data-idx");
      showMealDBModal(results[idx]);
    });
  });
}

function showMealDBModal(meal) {
  modalTitle.textContent = meal.strMeal;
  modalImg.src = meal.strMealThumb;
  modalCalories.textContent = '';
  // Gather ingredients
  let ingredients = '';
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients += `<li>${ingredient}${measure ? ' - ' + measure : ''}</li>`;
    }
  }
  modalDetails.innerHTML = `
    <strong>Ingredients:</strong><ul>${ingredients}</ul>
    <strong>Instructions:</strong><p>${meal.strInstructions}</p>
    <a href="${meal.strSource || '#'}" target="_blank">Full Recipe &rarr;</a>
  `;
  modal.style.display = "block";
}

closeBtn.onclick = function() {
  modal.style.display = "none";
};
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

// classic UI, no hero/landing logic

// Add a cookie icon to the brand title if not present
// This should be in index.html, not JS, but here's a reminder for the user:
// <h1 class="brand gradient-text"><img src="https://img.icons8.com/ios-filled/50/ffb347/cookie.png" alt="cookie" style="height:2em;vertical-align:middle;margin-right:0.5em;">COOKI Recipe App</h1>
