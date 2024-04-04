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

    // Check if the dragged asset has a value of 0
    var assetValue = parseInt(draggableElement.getAttribute('data-value'), 10);
    if (assetValue === 0) {
        return; // Exit if the asset's value is 0
    }
    
    // Target T-account section
    var targetSection = event.target.classList.contains('t-account-section') ?
                        event.target : event.target.closest('.t-account-section');

    if (!targetSection) {
        return; // Exit if no target section is found
    }

    // Check if dragged from another T-account (not from word bank)
    if (draggableElement.parentNode.classList.contains('t-account-section')) {
        // Source T-account
        var sourceSection = draggableElement.parentNode;
        var sourceTAccount = sourceSection.closest('.t-account');

        // Target T-account
        var targetTAccount = targetSection.closest('.t-account');

        // Check if the source and target T-accounts are the same, and the sections are the same
        if (sourceTAccount === targetTAccount && sourceSection === targetSection) {
            return; // Exit if the asset is dropped in the same section of the same T-account
        }

        // Adjust values and update display
        adjustValueForDrag(draggableElement, -100); // Decrement from source
        adjustValueForDrag(draggableElement, 100, targetSection); // Increment in target

        // Recalculate net worth for both T accounts
        calculateNetWorth(sourceTAccount);
        calculateNetWorth(targetTAccount);
    } else {
        // If dragging from the word bank
        var assetType = draggableElement.id; // 'id' of the asset in the word bank
        var existingAsset = [...targetSection.getElementsByClassName('draggable')].find(el => el.id.includes(assetType));
    
        if (existingAsset) {
            alert(`${capitalizeFirstLetter(assetType)} is already present in that T Account.`);
            return;
        }
    
        // Create and append the cloned element with a default value of 0
        var clonedElement = draggableElement.cloneNode(true);
        var value = 0; // Set the initial value to 0
        clonedElement.textContent += `: ${value}`;
        clonedElement.id = assetType + "_clone" + (new Date()).getTime(); // Ensure a unique ID
        clonedElement.setAttribute('data-value', value);    
        clonedElement.addEventListener('dragstart', drag);
    
        targetSection.prepend(clonedElement);
        addDeleteButton(clonedElement); 
    
        // Recalculate net worth
        calculateNetWorth(targetSection.closest('.t-account'));
    }    
}

function adjustValueForDrag(element, amount, targetSection) {
    var assetName = element.id.split('_')[0];
    var currentValue = parseInt(element.getAttribute('data-value'), 10);
    var newValue = currentValue + amount;

    // Function to create display text with color coding
    function createDisplayText(oldValue, newValue) {
        var color = newValue > oldValue ? 'green' : 'red';
        return `<span style='color: ${color};'>${oldValue} -> ${newValue}</span>`;
    }

    if (amount < 0) {
        // Decrement from source
        element.innerHTML = `${capitalizeFirstLetter(assetName)}: ` + createDisplayText(currentValue, newValue);
        element.setAttribute('data-value', newValue.toString());
    } else {
        // Increment in target
        var existingAssetInTarget = [...targetSection.getElementsByClassName('draggable')].find(el => el.id.includes(assetName));
        var targetNewValue = existingAssetInTarget ? parseInt(existingAssetInTarget.getAttribute('data-value'), 10) + 100 : 100;

        if (existingAssetInTarget) {
            // Update existing asset in the target
            existingAssetInTarget.innerHTML = `${capitalizeFirstLetter(assetName)}: ` + createDisplayText(targetNewValue - 100, targetNewValue);
            existingAssetInTarget.setAttribute('data-value', targetNewValue.toString());
        } else {
            // Create new asset in the target with value 100
            var clonedElement = element.cloneNode(true);
            clonedElement.innerHTML = `${capitalizeFirstLetter(assetName)}: ` + createDisplayText(0, 100);
            clonedElement.id = assetName + "_clone" + (new Date()).getTime(); // Ensure a unique ID
            clonedElement.setAttribute('data-value', '100');
            clonedElement.addEventListener('dragstart', drag);
            addDeleteButton(clonedElement); 
            targetSection.prepend(clonedElement);
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

    // Create delete buttons for specific T Accounts
    const tAccountsToDelete = ['Commercial Bank A', 'Non-Bank B', 'Commercial Bank B'];
    tAccountsToDelete.forEach(tAccountName => {
        let tAccounts = document.querySelectorAll('.t-account-header');
        tAccounts.forEach(header => {
            if (header.textContent.includes(tAccountName)) {
                addTAccountDeleteButton(header.parentNode);
            }
        });
    });

    // Event delegation for delete action
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('t-account-delete-btn')) {
            event.target.closest('.t-account').remove(); // Remove the closest T Account parent
        }
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
        netWorthBubble.removeAttribute('draggable', true);
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function adjustValue(element, amount) {
    var currentValue = parseInt(element.getAttribute('data-value'), 10);
    var newValue = currentValue + amount;
    var assetName = element.id.split('_')[0];
    var capitalizedAssetName = capitalizeFirstLetter(assetName);

    var color = amount > 0 ? 'green' : 'red';
    var displayText = `<span style='color: ${color};'>${currentValue} -> ${newValue}</span>`;

    // Find the existing span for the value display
    var valueDisplaySpan = element.querySelector('.value-display');
    if (valueDisplaySpan) {
        // Update the value display text
        valueDisplaySpan.innerHTML = `${capitalizedAssetName}: ${displayText}`;
    } else {
        // If the span doesn't exist, recreate the inner HTML
        element.innerHTML = `<span class="value-display">${capitalizedAssetName}: ${displayText}</span>`;
        addDeleteButton(element);
    }

    element.setAttribute('data-value', newValue.toString());
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

function editTitle(headerElement) {
    headerElement.setAttribute('contenteditable', 'true');
    headerElement.focus();

    // Handle when the user clicks away (blur event)
    headerElement.onblur = function() {
        headerElement.setAttribute('contenteditable', 'false');
        // Here you can also add logic to handle the updated title, like saving it
        // For example, if you want to update something in the backend or localStorage
    };
}

function deleteElement(element) {
    // Store a reference to the parent T account before removing the element
    let tAccount = element.closest('.t-account');
    
    // Remove the element
    element.remove();

    // Recalculate net worth for the T account
    calculateNetWorth(tAccount);
}

function addDeleteButton(element) {
    var deleteBtn = document.createElement('span');
    deleteBtn.textContent = '\u00D7'; // Unicode character for the multiplication symbol
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = function() { deleteElement(element); };
    element.appendChild(deleteBtn);
}

// Function to validate balance sheets
function validateBalanceSheets() {
    let totalNetWorth = 0;
    let assets = {};
    let totalLandValue = 0; // Total value of Land items
    let issues = [];

    // Calculate total net worth and tally assets
    document.querySelectorAll('.t-account').forEach(tAccount => {
        // Calculate net worth
        let netWorthElement = tAccount.querySelector('[id^=nw_]');
        let netWorthValue = parseInt(netWorthElement.getAttribute('data-value'), 10);
        totalNetWorth += netWorthValue;

        // Tally assets and liabilities, excluding Land
        tAccount.querySelectorAll('.t-account-section:nth-child(1) .draggable:not([id^=nw_])').forEach(asset => {
            let assetName = asset.textContent.split(':')[0].trim();
            let assetValue = parseInt(asset.getAttribute('data-value'), 10);
            if (assetName !== "Land") {
                assets[assetName] = (assets[assetName] || 0) + assetValue;
            } else {
                totalLandValue += assetValue; // Add to total Land value
            }
        });

        tAccount.querySelectorAll('.t-account-section:nth-child(2) .draggable:not([id^=nw_])').forEach(asset => {
            let assetName = asset.textContent.split(':')[0].trim();
            let assetValue = parseInt(asset.getAttribute('data-value'), 10);
            if (assetName !== "Land") {
                assets[assetName] = (assets[assetName] || 0) - assetValue;
            }
        });
    });

    // Subtract Land value from total net worth for the final check
    totalNetWorth -= totalLandValue;

    // Check if total net worth (excluding Land) is zero
    if (totalNetWorth !== 0) {
        issues.push(`Total net worth is off by ${totalNetWorth}.`);
    }

    // Check if assets (excluding Land) balance out
    for (let assetName in assets) {
        if (assets[assetName] !== 0) {
            issues.push(`Imbalance in ${assetName}: ${Math.abs(assets[assetName])} more on the ${assets[assetName] > 0 ? 'assets' : 'liabilities'} side.`);
        }
    }

    // Provide visual feedback
    if (issues.length === 0) {
        alert("Balance sheets balance.");
    } else {
        alert("Issues found.\n" + issues.join('\n'));
    }
}


// Event listener for the Validate button
document.getElementById('validateButton').addEventListener('click', validateBalanceSheets);

// Event listener for the Reset Display button
document.getElementById('resetDisplayButton').addEventListener('click', resetDisplay);

function resetDisplay() {
    let tAccountSections = document.querySelectorAll('.t-account .t-account-section');

    tAccountSections.forEach(section => {
        section.querySelectorAll('.draggable').forEach(draggable => {
            // Ensure this is a cloned draggable element (from the word bank)
            if (draggable.id.includes('_clone')) {
                var assetName = draggable.id.split('_')[0]; // Get the name of the asset from the cloned ID
                var capitalizedAssetName = capitalizeFirstLetter(assetName);
                var currentValue = parseInt(draggable.getAttribute('data-value'), 10);

                draggable.innerHTML = `${capitalizedAssetName}: ${currentValue}`; // Reset the text display
            }
        });
    });
}

// Function to create a delete button for specified T Accounts
function addTAccountDeleteButton(tAccount) {
    var deleteBtn = document.createElement('span');
    deleteBtn.textContent = '×'; // Multiplication sign
    deleteBtn.classList.add('t-account-delete-btn');
    tAccount.querySelector('.t-account-header').appendChild(deleteBtn); // Append to the header
}