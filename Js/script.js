document.addEventListener("DOMContentLoaded", function () {
  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyCYMR8LL_cfHNswh7nU8l4gwxWxKmiJOjc",
    authDomain: "clanlife-project.firebaseapp.com",
    projectId: "clanlife-project",
    storageBucket: "clanlife-project.firebasestorage.app",
    messagingSenderId: "553812082452",
    appId: "1:553812082452:web:0bb5f381c2d7b113d48c01",
    measurementId: "G-4PPGL63VKN"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const signupBtn = document.getElementById("signup-btn");
  const loginBtn = document.getElementById("login-btn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const message = document.getElementById("auth-message");
  const gameContainer = document.getElementById("game-container");
  const authContainer = document.getElementById("auth-container");
  const inventoryList = document.getElementById("inventory-list");

  let currentUser = null;
  let userInventory = [];
  let dens = [];
  let cats = [];

  // Auth
  signupBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        message.textContent = "Signup successful!";
        saveInventory([]);
        initializeDens();
      })
      .catch(error => {
        message.textContent = error.message;
      });
  });

  loginBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        message.textContent = "";
      })
      .catch(error => {
        message.textContent = error.message;
      });
  });

  auth.onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      showGame();
      loadInventory();
      loadDens();
    } else {
      showAuth();
    }
  });

  function logout() {
    auth.signOut();
  }

  // UI switching
  function showGame() {
    authContainer.style.display = "none";
    gameContainer.style.display = "block";
  }

  function showAuth() {
    authContainer.style.display = "block";
    gameContainer.style.display = "none";
  }

  function showTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(tab => {
      tab.style.display = "none";
    });
    document.getElementById(tabName).style.display = "block";
  }

  // Inventory
  function collectItem() {
    const items = ["Feather", "Shiny Stone", "Leaf", "Berry"];
    const item = items[Math.floor(Math.random() * items.length)];
    userInventory.push(item);
    document.getElementById("item-result").textContent = `You found a ${item}!`;
    updateInventoryUI();
    saveInventory(userInventory);
  }

  function updateInventoryUI() {
    inventoryList.innerHTML = "";
    userInventory.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      inventoryList.appendChild(li);
    });
  }

  function saveInventory(inventory) {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).set({ inventory }, { merge: true });
  }

  function loadInventory() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).get()
      .then(doc => {
        if (doc.exists) {
          userInventory = doc.data().inventory || [];
          updateInventoryUI();
        }
      });
  }

  // Dens
  function initializeDens() {
    dens = [{ name: "Main Den", cats: [] }];
    updateDenList();
    saveDens();
  }

  function createDen() {
    const input = document.getElementById("den-name-input");
    const name = input.value.trim();
    if (!name) return;

    if (dens.length >= 3) {
      alert("You’ve reached the maximum number of dens. More can be unlocked with crafting in future updates.");
      return;
    }

    dens.push({ name, cats: [] });
    input.value = "";
    updateDenList();
    saveDens();
  }

  function updateDenList() {
    const denList = document.getElementById("den-list");
    denList.innerHTML = "";

    dens.forEach((den, index) => {
      const denBlock = document.createElement("div");
      denBlock.classList.add("den");

      const denHeader = document.createElement("h4");
      denHeader.textContent = den.name;
      denHeader.style.cursor = "pointer";
      denHeader.onclick = () => {
        const content = denBlock.querySelector(".den-content");
        content.style.display = content.style.display === "none" ? "block" : "none";
      };

      const denContent = document.createElement("div");
      denContent.className = "den-content";
      denContent.style.display = "none";

      const exampleCat = document.createElement("p");
      exampleCat.textContent = "🧶 A cat will live here.";
      denContent.appendChild(exampleCat);

      // Add cats assigned to this den
      const catList = document.createElement("ul");
      cats.filter(cat => cat.den === den.name).forEach(cat => {
        const catItem = document.createElement("li");
        catItem.textContent = `${cat.name} (${cat.age})`;
        catList.appendChild(catItem);
      });
      denContent.appendChild(catList);

      denBlock.appendChild(denHeader);
      denBlock.appendChild(denContent);
      denList.appendChild(denBlock);
    });
  }

  function saveDens() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).set({ dens }, { merge: true });
  }

  function loadDens() {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).get()
      .then(doc => {
        if (doc.exists && doc.data().dens) {
          dens = doc.data().dens;
        } else {
          initializeDens();
        }
        updateDenList();
      });
  }

  // Cat Management
  function addCat() {
    const name = document.getElementById("cat-name-input").value.trim();
    const age = document.getElementById("cat-age-input").value;
    if (!name) return;

    const newCat = {
      id: Date.now().toString(),
      name,
      age,
      rank: age,
      den: null
    };

    cats.push(newCat);
    document.getElementById("cat-name-input").value = "";
    updateUnassignedCats();
    updateDenList();
  }

  function updateUnassignedCats() {
    const list = document.getElementById("unassigned-cats-list");
    list.innerHTML = "";

    cats.filter(cat => !cat.den).forEach(cat => {
      const li = document.createElement("li");
      li.textContent = `${cat.name} (${cat.age})`;

      const assignSelect = document.createElement("select");
      const defaultOption = document.createElement("option");
      defaultOption.textContent = "-- Assign to Den --";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      assignSelect.appendChild(defaultOption);

      dens.forEach(den => {
        const option = document.createElement("option");
        option.value = den.name;
        option.textContent = den.name;
        assignSelect.appendChild(option);
      });

      assignSelect.onchange = () => {
        cat.den = assignSelect.value;
        updateUnassignedCats();
        updateDenList();
      };

      li.appendChild(assignSelect);
      list.appendChild(li);
    });
  }

  // Expose to window for HTML buttons
  window.collectItem = collectItem;
  window.createDen = createDen;
  window.addCat = addCat;
});

import { listenForAuth } from "./js/auth.js";
import { loadUserData } from "./js/database.js";
import { createStarterData } from "./js/setup.js";
import { gameState } from "./script.js";

listenForAuth(async (user) => {
  if (user) {
    gameState.user = user;

    let data = await loadUserData(user.uid);

    if (!data) {
      await createStarterData(user.uid);
      data = await loadUserData(user.uid);
    }

    gameState.clan = data.clan;
    gameState.inventory = data.inventory;
    gameState.currency = data.currency;

    console.log("Game Loaded:", gameState);

    import { generateCat } from "./generator.js";
import { renderClan } from "./clan.js";

let gameState = {
  clan: []
};

// TEST BUTTON FUNCTION
window.testGenerate = function () {
  const cat = generateCat();

  gameState.clan.push(cat);

  renderClan(gameState);
};
  }
});
