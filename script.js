function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    event.dataTransfer.setData("text/plain", event.target.id);
}

function drop(event) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text/plain");
    var draggableElement = document.getElementById(data);

    if (draggableElement.parentNode.id === "wordBank") {
        var clonedElement = draggableElement.cloneNode(true);
        var value = 100; // Set the default value to 100
        clonedElement.textContent += `: ${value}`; // Add the ": 100" to the text
        clonedElement.id = draggableElement.id + "_clone" + (new Date()).getTime(); // Ensure a unique ID
        clonedElement.addEventListener('dragstart', drag);
        // Append the cloned element instead of the original draggableElement
        if (event.target.className.includes("t-account-section")) {
            event.target.appendChild(clonedElement);
        }
    }
}

// One 'DOMContentLoaded' to rule them all
document.addEventListener('DOMContentLoaded', (event) => {
    // Initial setup for draggables and clear button
    let draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', drag);
    });

    document.getElementById('clearButton').addEventListener('click', function() {
        document.querySelectorAll('.t-account-section').forEach(section => {
            Array.from(section.childNodes).forEach(child => {
                if (child.classList && child.classList.contains('draggable')) {
                    section.removeChild(child);
                }
            });
        });
    });

    // Click and delete functionality
    let selectedElement = null;

    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('draggable') && e.target.parentNode.classList.contains('t-account-section')) {
            if (selectedElement) {
                selectedElement.classList.remove('highlight');
            }
            selectedElement = e.target;
            selectedElement.classList.add('highlight');
        } else if (selectedElement) {
            selectedElement.classList.remove('highlight');
            selectedElement = null;
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' || e.key === 'Backspace' && selectedElement) {
            selectedElement.remove();
            selectedElement = null;
        }
    });

    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('draggable') && e.target.parentNode.classList.contains('t-account-section')) {
            showArrows(e.target);
            // Attach mouseleave event listener to the draggable element
            e.target.addEventListener('mouseleave', function() {
                removeArrows(e.target);
            });
        }
    });
    
});

function showArrows(element) {
    // Check if the arrows already exist to avoid creating duplicates
    if (!element.querySelector('.arrow-up')) {
        // Create up arrow
        var upArrow = document.createElement('span');
        upArrow.textContent = '↑';
        upArrow.classList.add('arrow-up');
        upArrow.onclick = function() { adjustValue(element, 100); };
        element.appendChild(upArrow);
    }

    if (!element.querySelector('.arrow-down')) {
        // Create down arrow
        var downArrow = document.createElement('span');
        downArrow.textContent = '↓';
        downArrow.classList.add('arrow-down');
        downArrow.onclick = function() { adjustValue(element, -100); };
        element.appendChild(downArrow);
    }
}

function adjustValue(element, amount) {
    var value = parseInt(element.getAttribute('data-value'), 10);
    value += amount;
    element.setAttribute('data-value', value.toString());
    element.textContent = `${element.textContent.split(':')[0]}: ${value}`;
}

function removeArrows(element) {
    const upArrow = element.querySelector('.arrow-up');
    const downArrow = element.querySelector('.arrow-down');
    if (upArrow) {
        upArrow.remove();
    }
    if (downArrow) {
        downArrow.remove();
    }
}
