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

        if (event.target.className.includes("t-account-section")) {
            // Prepend the cloned element instead of appending it to insert it at the top
            event.target.prepend(clonedElement);
        }
    }

    // After the drop, recalculate net worth for the affected T-account
    calculateNetWorth(event.target.closest('.t-account'));
}

// One 'DOMContentLoaded' to rule them all
document.addEventListener('DOMContentLoaded', (event) => {
    // Initial setup for draggables and clear button
    let draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', drag);
    });

    // Adjust the clear button functionality
    document.getElementById('clearButton').addEventListener('click', function() {
        document.querySelectorAll('.t-account').forEach(tAccount => {
            // Select the right section of each T-account
            let rightSection = tAccount.querySelector('.t-account-section:nth-child(2)');
            Array.from(rightSection.childNodes).forEach(child => {
                // Remove all elements except the net worth bubble
                if (child.classList && child.classList.contains('draggable') && !child.id.startsWith('nw_')) {
                    rightSection.removeChild(child);
                }
            });
    
            // Select the left section of each T-account
            let leftSection = tAccount.querySelector('.t-account-section:nth-child(1)');
            // Remove all elements from the left section
            while (leftSection.firstChild) {
                leftSection.removeChild(leftSection.firstChild);
            }
    
            // After clearing, recalculate net worth for each T-account
            calculateNetWorth(tAccount);
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

    // Recalculate net worth after deleting an element
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
            let tAccount = selectedElement.closest('.t-account');
            selectedElement.remove();
            selectedElement = null;

            // After deletion, recalculate net worth
            calculateNetWorth(tAccount);
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

    // Function to create a net worth bubble
    function createNetWorthBubble() {
        var netWorthBubble = document.createElement('div');
        netWorthBubble.classList.add('draggable');
        netWorthBubble.textContent = 'Net Worth: 0';
        netWorthBubble.id = 'nw_' + (new Date()).getTime(); // Ensure a unique ID
        netWorthBubble.setAttribute('draggable', true);
        netWorthBubble.setAttribute('data-value', '0');
        netWorthBubble.addEventListener('dragstart', drag);
        // Set the font weight to bold
        netWorthBubble.style.fontWeight = 'bold';
        return netWorthBubble;
    }    

    // Populate Net Worth bubble in each T account section on the right side
    let tAccountSections = document.querySelectorAll('.t-account-body .t-account-section:nth-child(2)');
    tAccountSections.forEach(section => {
        let netWorthBubble = createNetWorthBubble();
        section.appendChild(netWorthBubble);
    });
    
});

function showArrows(element) {
    // If the element is a net worth bubble, don't show arrows
    if (element.id.startsWith('nw_')) {
        return;
    }

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

    // After adjustment, recalculate net worth for the affected T-account
    calculateNetWorth(element.closest('.t-account'));
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

function calculateNetWorth(tAccount) {
    let leftSideSum = 0, rightSideSum = 0;
    let leftItems = tAccount.querySelectorAll('.t-account-section:nth-child(1) .draggable');
    let rightItems = tAccount.querySelectorAll('.t-account-section:nth-child(2) .draggable:not([id^=nw_])');

    leftItems.forEach(item => {
        leftSideSum += parseInt(item.getAttribute('data-value'), 10);
    });

    rightItems.forEach(item => {
        rightSideSum += parseInt(item.getAttribute('data-value'), 10);
    });

    let netWorth = leftSideSum - rightSideSum;
    let netWorthElement = tAccount.querySelector('.t-account-section:nth-child(2) [id^=nw_]');
    if (netWorthElement) {
        netWorthElement.textContent = `Net Worth: ${netWorth}`;
        netWorthElement.setAttribute('data-value', netWorth.toString());
    }
}
