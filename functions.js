let currentColors = [];
let savedPalettes = JSON.parse(localStorage.getItem("palettes")) || [];
let editingIndex = null;
let selectedColorIndex = null;

const commonColors = {
    // ... (keep your commonColors object as is)
    "#f1f3e0": "cream",
    "#d2dcb6": "light-green",
    "#a1bc98": "sage",
    "#778873": "deep-green",
    "#2a2a2a": "text-dark",
    "#555555": "text-light",
    "#ff0000": "red",
    "#00ff00": "green",
    "#0000ff": "blue",
    "#ffff00": "yellow",
    "#ffa500": "orange",
    "#800080": "purple",
    "#ffffff": "white",
    "#000000": "black",
};

function toHex(color) {
    let ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    return ctx.fillStyle.toLowerCase();
}

function autoNameColor(color, index) {
    let hex = toHex(color);
    if (commonColors[hex]) return commonColors[hex];
    return `color-${index + 1}`;
}

function addColor() {
    const input = document.getElementById("colorInput").value.trim();
    if (!input) return;
    let index = currentColors.length;
    let name = autoNameColor(input, index);
    currentColors.push({ color: input, name: name });
    document.getElementById("colorInput").value = "";
    renderCurrentPalette();
}

function updateColorName(index, value) {
    currentColors[index].name = value.trim();
}

document.getElementById("deleteSelectedColorBtn").onclick = () => {
    if (selectedColorIndex !== null) {
        currentColors.splice(selectedColorIndex, 1);
        // Recalculate selectedColorIndex to prevent issues after splice
        selectedColorIndex = null; 
        renderCurrentPalette();
    } else {
        alert("Please select a color to delete.");
    }
};

function savePalette() {
    const name = document.getElementById("paletteName").value.trim();
    if (!name) { alert("Please enter a palette name."); return; }
    if (currentColors.length === 0) { alert("The current palette is empty."); return; }

    if (editingIndex !== null) {
        savedPalettes[editingIndex] = { name: name, colors: [...currentColors] };
        editingIndex = null;
    } else {
        savedPalettes.push({ name: name, colors: [...currentColors] });
    }

    localStorage.setItem("palettes", JSON.stringify(savedPalettes));
    currentColors = [];
    selectedColorIndex = null;
    document.getElementById("paletteName").value = "";
    renderCurrentPalette();
    renderSavedPalettes();
}

function cancelEdit() {
    editingIndex = null;
    currentColors = [];
    selectedColorIndex = null;
    document.getElementById("paletteName").value = "";
    renderCurrentPalette();
}

function deletePalette(index) {
    savedPalettes.splice(index, 1);
    localStorage.setItem("palettes", JSON.stringify(savedPalettes));
    renderSavedPalettes();
}

function loadPaletteForEditing(index) {
    const palette = savedPalettes[index];
    document.getElementById("paletteName").value = palette.name;
    // Deep copy the colors to avoid modifying the saved palette directly before saving
    currentColors = JSON.parse(JSON.stringify(palette.colors));
    editingIndex = index;
    selectedColorIndex = null;
    renderCurrentPalette();
}

function copyPaletteAsCSS(index, event) {
    event.stopPropagation();
    const palette = savedPalettes[index];
    let cssText = ":root {\n";
    palette.colors.forEach((item, i) => {
        let varName = item.name ? `--${item.name}` : `--color-${i+1}`;
        cssText += `  ${varName}: ${item.color};\n`;
    });
    cssText += "}";

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cssText)
            .then(() => alert("Palette copied as CSS :root!"))
            .catch(() => fallbackCopy(cssText));
    } else {
        fallbackCopy(cssText);
    }
}

function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); alert("Palette copied as CSS :root!"); }
    catch (err) { alert("Failed to copy."); console.error(err); }
    document.body.removeChild(textarea);
}

// Drag-and-drop for vertical stacking
let dragStartIndex = null;
function dragStart(e, index) { dragStartIndex = index; e.currentTarget.classList.add("dragging"); }
function dragEnd(e) { e.currentTarget.classList.remove("dragging"); dragStartIndex = null; }
function dragOver(e) { e.preventDefault(); }
function drop(e, index) {
    e.preventDefault();
    if (dragStartIndex === null || dragStartIndex === index) return;
    const moved = currentColors.splice(dragStartIndex, 1)[0];
    currentColors.splice(index, 0, moved);
    renderCurrentPalette();
}

function renderCurrentPalette() {
    const container = document.getElementById("currentPalette");
    container.innerHTML = "";

    const paletteName = document.getElementById("paletteName").value.trim() || "Untitled Palette";
    const nameLabel = document.createElement("div");
    nameLabel.className = "palette-panel-name";
    nameLabel.textContent = paletteName;
    container.appendChild(nameLabel);

    currentColors.forEach((item, index) => {
        let box = document.createElement("div");
        box.className = "color-box" + (index === selectedColorIndex ? " selected" : "");
        box.style.background = item.color;
        box.draggable = true;

        box.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent container click if necessary
            selectedColorIndex = (selectedColorIndex === index) ? null : index;
            renderCurrentPalette();
        });
        box.addEventListener("dragstart", (e) => dragStart(e, index));
        box.addEventListener("dragend", dragEnd);
        box.addEventListener("dragover", dragOver);
        box.addEventListener("drop", (e) => drop(e, index));

        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = "Variable Name";
        nameInput.className = "color-name-input";
        nameInput.value = item.name;
        nameInput.onchange = (e) => updateColorName(index, e.target.value);
        
        // Prevent click events on the input from bubbling up and de-selecting the box
        nameInput.onclick = (e) => e.stopPropagation();

        box.appendChild(nameInput);
        container.appendChild(box);
    });

    // Update buttons visibility
    document.getElementById("cancelEditBtn").style.display = editingIndex !== null ? "inline-block" : "none";
    document.getElementById("deleteSelectedColorBtn").disabled = selectedColorIndex === null;
}

function renderSavedPalettes() {
    const container = document.getElementById("savedPalettes");
    container.innerHTML = "";

    savedPalettes.forEach((palette, pIndex) => {
        let paletteDiv = document.createElement("div");
        // Add a class for specific saved palette styling
        paletteDiv.className = "palette-panel saved-palette"; 

        let header = document.createElement("div");
        header.className = "palette-header";
        header.innerHTML = `
            <h3>${palette.name}</h3>
            <div>
                <button class="action-button delete-button" onclick="deletePalette(${pIndex}); event.stopPropagation();">Delete</button>
                <button class="action-button secondary-button" onclick="copyPaletteAsCSS(${pIndex}, event)">Copy as CSS</button>
            </div>
        `;
        paletteDiv.appendChild(header);

        palette.colors.forEach(item => {
            let colorBox = document.createElement("div");
            colorBox.className = "color-box";
            colorBox.style.background = item.color;

            // Use a <div> instead of an <input> for display only in saved palettes
            let nameLabel = document.createElement("div");
            nameLabel.className = "color-name-input";
            nameLabel.textContent = item.name;
            // Override opacity and pointer-events for permanent visibility on hover
            nameLabel.style.opacity = '0';
            nameLabel.style.pointerEvents = 'none';

            // Add hover effect for the saved palette color name
            colorBox.addEventListener('mouseenter', () => {
                nameLabel.style.opacity = '1';
                nameLabel.style.pointerEvents = 'auto';
            });
            colorBox.addEventListener('mouseleave', () => {
                nameLabel.style.opacity = '0';
                nameLabel.style.pointerEvents = 'none';
            });

            colorBox.appendChild(nameLabel);
            paletteDiv.appendChild(colorBox);
        });

        paletteDiv.onclick = () => loadPaletteForEditing(pIndex);
        container.appendChild(paletteDiv);
    });
}

// Initial render
renderSavedPalettes();
renderCurrentPalette(); // Render the current palette area on load (it will be empty)