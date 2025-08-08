const searchForm = document.querySelector("form");
const searchResultDiv = document.querySelector(".search-result");
const container = document.querySelector(".container");
let searchQuery = "";
const APP_ID = "4c502aed";
const APP_key = "9a3222b9fe5c26bb3bb8f7754ecb0f2d";

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  searchQuery = e.target.querySelector("input").value;
  searchResultDiv.innerHTML = '<div class="spinner"></div>';
  fetchAPI();
});

async function fetchAPI (){
  const baseURL = `https://api.edamam.com/search?q=${searchQuery}&app_id=${APP_ID}&app_key=${APP_key}&from=0&to=50`;
  try {
    const response = await fetch(baseURL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    generateHTML(data.hits);
  } catch (error) {
    searchResultDiv.innerHTML = `<p class="error-message">Something went wrong, please try again! </p>`;
  }
}

function generateHTML(results) {
  container.classList.remove("initial");
  let generatedHTML = "";
  if (results.length > 0) {
    results.map((result) => {
      generatedHTML += `
      <div class="item">
          <img src="${result.recipe.image}" alt="img">
          <div class="flex-container">
            <h1 class="title">${result.recipe.label}</h1>
            <a class="view-button" target="_blank" href="${
              result.recipe.url
            }">View Recipe</a>
          </div>
          <p class="item-data">Calories: ${result.recipe.calories.toFixed(
            2
          )}</p>
          <p class="item-data">Diet label: ${
            result.recipe.dietLabels.length > 0
              ? result.recipe.dietLabels
              : "No Data Found"
          }</p>
          <p class="item-data">Health labels: ${result.recipe.healthLabels}</p>
      </div>
      `;
    });
  } else {
    generatedHTML = `<p class="error-message">No recipes found for your query. Please try another search.</p>`;
  }
  searchResultDiv.innerHTML = generatedHTML;
}
