window.onload = function () {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
  } else {
    const username = localStorage.getItem("username");
    document.getElementById("username").textContent = username;
  }
};

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("username");
  window.location.href = "index.html";
}
// // Warn the user when they try to navigate away from the page
window.addEventListener("beforeunload", (event) => {
  event.preventDefault();
  event.returnValue = "";
  logout(); // Log out the user before leaving
});

//user data details

function initializeUserDetails() {
  const weight = localStorage.getItem('user_weight');
  const height = localStorage.getItem('user_height');
  const dob = localStorage.getItem('user_dob');
  const gender = localStorage.getItem('user_gender');
  
  if (weight) document.getElementById('weight').value = weight;
  if (height) document.getElementById('height').value = height;
  if (dob) document.getElementById('dob').value = dob;
  if (gender) document.getElementById('gender').value = gender;
}

// Function to save user details to local storage
function saveUserDetails() {
  const weight = document.getElementById('weight').value;
  const height = document.getElementById('height').value;
  const dob = document.getElementById('dob').value;
  
  function calculateAge(dobString) {
    if (dobString) {
      const dob = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }
      
      return age;
    } else {
      return null;
    }
  }
  
  const age = calculateAge(dob);
  const gender = document.getElementById('gender').value;

  // Save all user details to local storage
  localStorage.setItem('user_weight', weight);
  localStorage.setItem('user_height', height);
  localStorage.setItem('user_dob', dob);
  localStorage.setItem('user_gender', gender);
  localStorage.setItem('user_age', age); // Store age in local storage
  
  console.log(
    `User Details - Weight: ${weight}, Height: ${height}, DOB: ${dob}, Gender: ${gender}, Age: ${age}`
  );
}

// Call initializeUserDetails when the page loads to set default values if present
document.addEventListener('DOMContentLoaded', initializeUserDetails);
//meal tracking
const apiKey = 'apikey';
const url = 'https://api.calorieninjas.com/v1/nutrition';

const mealForm = document.getElementById('meal-form');
const mealList = document.getElementById('meal-list');
const totalCaloriesElement = document.getElementById('total-calories');
const foodInfoDiv = document.getElementById('food-info');
const showInfoButton = document.getElementById('show-info');
const mealDateInput = document.getElementById('meal-date');
const selectedDateElement = document.getElementById('selected-date');
const foodChartDiv = document.getElementById('food-chart');
const nutritionChartCanvas = document.getElementById('nutrition-chart').getContext('2d');

let chartInstance = null; // To hold the chart instance

const roundToDecimal = (value, decimals = 1) => {
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
};

const updateTotalCalories = () => {
    let totalCalories = 0;
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    meals.forEach(meal => {
        totalCalories += roundToDecimal(meal.calories);
    });
    totalCaloriesElement.textContent = roundToDecimal(totalCalories);
};

const addMealToDom = (meal, index) => {
    const mealItem = document.createElement('li');
    mealItem.innerHTML = `
        ${meal.name} - ${roundToDecimal(meal.calories)} calories :: time- ${new Date(meal.timestamp).toLocaleTimeString()} 
        <button class="expand-meal">Expand</button>
        <button class="remove-meal" data-index="${index}">X</button>
        <ul class="food-list" style="display: none;"></ul>
    `;
    mealList.appendChild(mealItem);

    const expandButton = mealItem.querySelector('.expand-meal');
    const removeButton = mealItem.querySelector('.remove-meal');
    const foodList = mealItem.querySelector('.food-list');

    expandButton.addEventListener('click', () => {
        if (foodList.style.display === 'none') {
            foodList.style.display = 'block';
            foodList.innerHTML = ''; // Clear existing food list to avoid duplicates
            meal.foods.forEach(food => {
                const foodItem = document.createElement('li');
                foodItem.innerHTML = `
                    ${food.name} - ${roundToDecimal(food.calories)} calories
                    <button class="show-info">Show Info</button>
                    <div class="food-info" style="display: none;">
                        <strong>Total Fat:</strong> ${roundToDecimal(food.fat_total_g)} g<br>
                        <strong>Saturated Fat:</strong> ${roundToDecimal(food.fat_saturated_g)} g<br>
                        <strong>Protein:</strong> ${roundToDecimal(food.protein_g)} g<br>
                        <strong>Carbohydrates:</strong> ${roundToDecimal(food.carbohydrates_total_g)} g<br>
                        <strong>Sugar:</strong> ${roundToDecimal(food.sugar_g)} g<br>
                        <strong>Fiber:</strong> ${roundToDecimal(food.fiber_g)} g<br>
                        <strong>Sodium:</strong> ${roundToDecimal(food.sodium_mg)} mg<br>
                        <strong>Potassium:</strong> ${roundToDecimal(food.potassium_mg)} mg<br>
                        <strong>Cholesterol:</strong> ${roundToDecimal(food.cholesterol_mg)} mg<br>
                    </div>
                `;
                foodList.appendChild(foodItem);

                const showInfoButton = foodItem.querySelector('.show-info');
                const foodInfo = foodItem.querySelector('.food-info');
                showInfoButton.addEventListener('click', () => {
                    if (foodInfo.style.display === 'none') {
                        foodInfo.style.display = 'block';
                        showInfoButton.textContent = 'Hide Info';
                        renderChart(food); // Render chart with food information
                    } else {
                        foodInfo.style.display = 'none';
                        showInfoButton.textContent = 'Show Info';
                        foodChartDiv.style.display = 'none'; // Hide chart
                        if (chartInstance) {
                            chartInstance.destroy(); // Destroy previous chart instance
                            chartInstance = null;
                        }
                    }
                });
            });
        } else {
            foodList.style.display = 'none';
        }
    });

    removeButton.addEventListener('click', () => {
        removeMeal(index);
    });
};

const removeMeal = (index) => {
    let meals = JSON.parse(localStorage.getItem('meals')) || [];
    meals = meals.filter((_, i) => i !== index);
    localStorage.setItem('meals', JSON.stringify(meals));
    loadMeals(mealDateInput.value); // Reload meals for the current date
};

const saveMeal = (meal) => {
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    meals.push(meal);
    localStorage.setItem('meals', JSON.stringify(meals));
    return meals.length - 1;
};

const fetchFoodInfo = async (foodQuery) => {
    if (!foodQuery.trim()) {
        return []; // Return empty array if the query is empty
    }
    try {
        const response = await fetch(`${url}?query=${foodQuery}`, {
            method: 'GET',
            headers: {
                'X-Api-Key': apiKey
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return [];
    }
};

const loadMeals = (date) => {
    const meals = JSON.parse(localStorage.getItem('meals')) || [];
    mealList.innerHTML = ''; // Clear existing meals
    const filteredMeals = meals.filter(meal => meal.timestamp.startsWith(date));
    filteredMeals.forEach((meal, index) => {
        addMealToDom(meal, index);
    });
    updateTotalCalories();
    selectedDateElement.textContent = date;
};

const renderChart = (food) => {
    foodChartDiv.style.display = 'block';
    
    // Clear the previous chart if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const data = {
        labels: ['Total Fat', 'Saturated Fat', 'Protein', 'Carbohydrates', 'Sugar', 'Fiber', 'Sodium', 'Potassium', 'Cholesterol'],
        datasets: [{
            label: food.name,
            data: [
                food.fat_total_g,
                food.fat_saturated_g,
                food.protein_g,
                food.carbohydrates_total_g,
                food.sugar_g,
                food.fiber_g,
                food.sodium_mg / 1000, // Convert mg to g for better readability
                food.potassium_mg / 1000, // Convert mg to g for better readability
                food.cholesterol_mg / 1000 // Convert mg to g for better readability
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(199, 199, 199, 0.2)',
                'rgba(0, 255, 0, 0.2)',
                'rgba(255, 0, 0, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(199, 199, 199, 1)',
                'rgba(0, 255, 0, 1)',
                'rgba(255, 0, 0, 1)'
            ],
            borderWidth: 1
        }]
    };

    chartInstance = new Chart(nutritionChartCanvas, {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

showInfoButton.addEventListener('click', async () => {
    const foodQuery = document.getElementById('meal-info').value;
    if (!foodQuery.trim()) {
        foodInfoDiv.innerHTML = 'Please enter a food item.';
        foodInfoDiv.style.display = 'block';
        return; // Exit if the query is empty
    }

    const foodItems = await fetchFoodInfo(foodQuery);

    if (foodItems.length > 0) {
        foodInfoDiv.style.display = 'block';
        foodInfoDiv.innerHTML = '';

        foodItems.forEach(food => {
            const foodInfoItem = document.createElement('div');
            foodInfoItem.innerHTML = `
                <strong>Food Item:</strong> ${food.name}<br>
                <strong>Calories:</strong> ${roundToDecimal(food.calories)} kcal<br>
                <button class="show-more-info">Show More Info</button>
                <div class="detailed-info" style="display: none;">
                    <strong>Total Fat:</strong> ${roundToDecimal(food.fat_total_g)} g<br>
                    <strong>Saturated Fat:</strong> ${roundToDecimal(food.fat_saturated_g)} g<br>
                    <strong>Protein:</strong> ${roundToDecimal(food.protein_g)} g<br>
                    <strong>Carbohydrates:</strong> ${roundToDecimal(food.carbohydrates_total_g)} g<br>
                    <strong>Sugar:</strong> ${roundToDecimal(food.sugar_g)} g<br>
                    <strong>Fiber:</strong> ${roundToDecimal(food.fiber_g)} g<br>
                    <strong>Sodium:</strong> ${roundToDecimal(food.sodium_mg)} mg<br>
                    <strong>Potassium:</strong> ${roundToDecimal(food.potassium_mg)} mg<br>
                    <strong>Cholesterol:</strong> ${roundToDecimal(food.cholesterol_mg)} mg<br>
                </div>
            `;
            foodInfoDiv.appendChild(foodInfoItem);

            const showMoreInfoButton = foodInfoItem.querySelector('.show-more-info');
            const detailedInfoDiv = foodInfoItem.querySelector('.detailed-info');

            showMoreInfoButton.addEventListener('click', () => {
                if (detailedInfoDiv.style.display === 'none') {
                    detailedInfoDiv.style.display = 'block';
                    showMoreInfoButton.textContent = 'Hide Info';
                    foodChartDiv.style.display = 'none'; // Hide chart
                    if (chartInstance) {
                        chartInstance.destroy(); // Destroy previous chart instance
                        chartInstance = null;
                    }
                } else {
                    detailedInfoDiv.style.display = 'none';
                    showMoreInfoButton.textContent = 'Show More Info';
                }
            });
        });
    } else {
        foodInfoDiv.style.display = 'none';
        foodInfoDiv.innerHTML = 'No information available for this food item.';
    }
});

mealForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const mealName = document.getElementById('meal-name').value;
    const foodQuery = document.getElementById('meal-info').value;

    if (!foodQuery.trim()) {
        alert('Please enter a food item.');
        return; // Exit if the query is empty
    }

    const foodItems = await fetchFoodInfo(foodQuery);
    const foods = foodItems.map(item => ({
        name: item.name,
        calories: roundToDecimal(item.calories),
        fat_total_g: roundToDecimal(item.fat_total_g),
        fat_saturated_g: roundToDecimal(item.fat_saturated_g),
        protein_g: roundToDecimal(item.protein_g),
        carbohydrates_total_g: roundToDecimal(item.carbohydrates_total_g),
        sugar_g: roundToDecimal(item.sugar_g),
        fiber_g: roundToDecimal(item.fiber_g),
        sodium_mg: roundToDecimal(item.sodium_mg),
        potassium_mg: roundToDecimal(item.potassium_mg),
        cholesterol_mg: roundToDecimal(item.cholesterol_mg)
    }));

    const meal = {
        name: mealName,
        foods: foods,
        calories: foods.reduce((totalCal, food) => totalCal + food.calories, 0),
        timestamp: new Date().toISOString()
    };

    const index = saveMeal(meal);
    addMealToDom(meal, index);
    updateTotalCalories();
    mealForm.reset();
});

mealDateInput.addEventListener('input', (event) => {
    const selectedDate = event.target.value;
    loadMeals(selectedDate);
});

// Initialize with current date
const currentDate = new Date().toISOString().slice(0, 10);
mealDateInput.value = currentDate;
loadMeals(currentDate);

//workout tracking
async function generateWorkouts() {
  const apiKey = 'apikey';
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

  const styleOfWorkout = document.getElementById('style-of-workout').value;
  const muscleGroup = document.getElementById('muscle-group').value;
  const workoutDuration = document.getElementById('workout-duration').value;

  // Retrieve stored user details
  const age = localStorage.getItem('user_age');
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const userBmi = weight / (height * height) * 10000;
  const difficulty = document.getElementById('difficulty').value;

  const prompt = `Generate 5 workouts using for a person of age=${age},  BMI=${userBmi}, and difficulty=${difficulty} which is of ${styleOfWorkout} for ${muscleGroup} and is around ${workoutDuration} minutes long. Each workout should have step-by-step instructions under 20 words, amount of calories burnt, workout duration. . in the output add a <br> after each workout`;

  const requestBody = {
      contents: [
          {
              role: "user",
              parts: [
                  { text: prompt }
              ]
          }
      ]
  };

  try {
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const workouts = data.candidates[0].content.parts[0].text;
      document.getElementById('goal-list').innerHTML= workouts;
  } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
      document.getElementById('goal-list').textContent = 'Error: ' + error.message;
  }
}

document.getElementById('generate-workouts').addEventListener('click', generateWorkouts);
document.getElementById('generate-workouts').addEventListener('click', ()=>{
  generateWorkouts();
});
//goal setting

//your monthly progress report
document
  .getElementById("progress-form")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission
    const date = document.getElementById("progress-date").value;
    const weightchange = document.getElementById("weight-change").value;
    const weightlift = document.getElementById("weightlifting-number").value;
    const bodyreps = document.getElementById("body-weight-reps").value;
    const hoursworkout = document.getElementById("hours-workout").value;
    const cardio = document.getElementById("cardio-done").value;
    // Import jsPDF
    const { jsPDF } = window.jspdf;
    // Create a new PDF document
    const doc = new jsPDF();
    // Add text to the PDF
    doc.text("Your Monthly Report:-", 10, 20);
    doc.text(`Date: ${date}`, 10, 30);
    doc.text(`Weight-Change: ${weightchange}`, 10, 40);
    doc.text(`Weight-Lift: ${weightlift}`, 10, 50);
    doc.text(`Body-Reps: ${bodyreps}`, 10, 60);
    doc.text(`Hours-Workout: ${hoursworkout}`, 10, 70);
    doc.text(`Cardio: ${cardio}`, 10, 80);
    // Save the PDF
    doc.save("monthly-fitness-report.pdf");
  });
