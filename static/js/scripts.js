function openUpdateModal(itemId, currentQuantity) {
    document.getElementById("item_id").value = itemId;
    document.getElementById("new_quantity").value = currentQuantity;
    document.getElementById("updateStockModal").style.display = "block";
}

function closeUpdateModal() {
    document.getElementById("updateStockModal").style.display = "none";
}

function updateStock() {
    var formData = new FormData(document.getElementById("updateStockForm"));

    fetch("/update_stock/" + formData.get("item_id"), {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        closeUpdateModal();
        location.reload(); // Refresh the page to update the displayed data
    })
    .catch(error => {
        console.log(error);
        alert("Error updating stock");
    });
}

function confirmDelete(itemId) {
    var confirmDelete = confirm("Are you sure you want to delete this item?");
    if (confirmDelete) {
        // If user confirms, send a request to delete the item
        deleteItem(itemId);
    }
}

function deleteItem(itemId) {
    // Send an AJAX request to the server to delete the item
    fetch("/delete_item/" + itemId, {
        method: "POST",
    })
    .then(response => {
        if (response.ok) {
            location.reload();
        } else {
            alert("Failed to delete item.");
        }
    })
    .catch(error => {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
    });
}

// Function to display notifications
function displayNotification(message) {
    // Create a new notification element
    var notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Append the notification to the container
    document.getElementById('notification-container').appendChild(notification);

    // Remove the notification after a certain time 
    setTimeout(function() {
        notification.remove();
    }, 5000);
}

function searchInventory() {
    var searchQuery = document.getElementById('searchInput').value;

    // Make a request to the backend with the search query
    fetch('/get_inventory_data?search=' + encodeURIComponent(searchQuery))
        .then(response => response.json())
        .then(data => {
            // Call a function to update the inventory display based on the search results
            updateInventoryDisplay(data);

            // Show or hide the "Back to Inventory" button based on search results
            toggleBackToInventoryButton();
        })
        .catch(error => console.error('Error searching inventory:', error));
}

// Function to update the inventory display
function updateInventoryDisplay(inventoryData) {
    var tableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];

    // Clear existing rows from the table body
    while (tableBody.firstChild) {
        tableBody.removeChild(tableBody.firstChild);
    }

    // Iterate through the search results and append rows to the table
    inventoryData.forEach(function (item) {
        var newRow = tableBody.insertRow(tableBody.rows.length);
        var cell1 = newRow.insertCell(0);
        var cell2 = newRow.insertCell(1);
        var cell3 = newRow.insertCell(2);
        var cell4 = newRow.insertCell(3);
        var cell5 = newRow.insertCell(4);

        // Populate the cells with data from the search results
        cell1.innerHTML = item.item_name;
        cell2.innerHTML = item.quantity;
        cell3.innerHTML = item.reorder_threshold;

        // Add "Update Stock" button
        var updateStockButton = document.createElement('button');
        updateStockButton.textContent = 'Update Stock';
        updateStockButton.onclick = function () {
            openUpdateModal(item.id, item.quantity);
        };
        cell4.appendChild(updateStockButton);

        // Add "Delete Item" button
        var deleteItemButton = document.createElement('button');
        deleteItemButton.textContent = 'Delete Item';
        deleteItemButton.classList.add("delete-item-button");
        deleteItemButton.onclick = function () {
            confirmDelete(item.id);
        };
        cell5.appendChild(deleteItemButton);
    });
}

function toggleBackToInventoryButton() {
    var backToInventoryButton = document.getElementById('backToInventoryButton');
    backToInventoryButton.style.display = 'block';
}

function fetchNotifications() {
    fetch('/get_notifications')
        .then(response => response.json())
        .then(data => {
            // Clear existing notifications
            document.getElementById('notification-container').innerHTML = '';
            // Display each notification
            data.forEach(notification => {
                displayNotification(notification);
            });
        })
        .catch(error => console.error('Error fetching notifications:', error));
}

function fetchInventoryData() {
    fetch('/get_inventory_data')
        .then(response => response.json())
        .then(data => {
            // Process the received inventory data
            console.log('Received inventory data:', data);
        })
        .catch(error => console.error('Error fetching inventory data:', error));
}

// Fetch inventory data periodically 
setInterval(fetchInventoryData, 5000);

// Fetch notifications periodically 
setInterval(fetchNotifications, 5000);
