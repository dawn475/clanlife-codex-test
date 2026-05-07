// js/clan.js

export function renderCat(cat) {
  const div = document.createElement("div");
  div.classList.add("cat-card");

  const img = document.createElement("img");

  // IMPORTANT: matches your assets folder
  img.src = "assets/sprites/base/body.png";

  // Apply simple color tint
  img.style.backgroundColor = cat.appearance.baseColor.hex;
  img.style.mixBlendMode = "multiply";

  const name = document.createElement("p");
  name.innerText = cat.name;

  div.appendChild(img);
  div.appendChild(name);

  return div;
}

export function renderClan(gameState) {
  const container = document.getElementById("clan-container");

  if (!container) return;

  container.innerHTML = "";

  gameState.clan.forEach(cat => {
    const card = renderCat(cat);
    container.appendChild(card);
  });
}
