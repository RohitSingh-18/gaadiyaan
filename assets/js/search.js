const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const minValue = document.getElementById("min-value");
const maxValue = document.getElementById("max-value");

minPrice.oninput = function() {
    minValue.textContent = this.value;
}

maxPrice.oninput = function() {
    maxValue.textContent = this.value;
}
