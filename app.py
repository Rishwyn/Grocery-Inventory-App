from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_mysqldb import MySQL

app = Flask(__name__)
app.config['MYSQL_HOST'] = ''
app.config['MYSQL_USER'] = ''
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = ''

mysql = MySQL(app)

notifications = []

@app.route('/')
def display_inventory():
    cur = mysql.connection.cursor()
    cur.execute('SELECT * FROM inventory')
    data = cur.fetchall()
    cur.close()
    return render_template('inventory.html', inventory_data=data)

@app.route('/add_item', methods=['GET', 'POST'])
def add_item():
    if request.method == 'POST':
        item_name = request.form['item_name']
        quantity = request.form['quantity']
        reorder_threshold = request.form['reorder_threshold']

        cur = mysql.connection.cursor()
        
        # Inserting data into the 'inventory' table
        cur.execute('INSERT INTO inventory (item_name, quantity, reorder_threshold) VALUES (%s, %s, %s)',
                    (item_name, quantity, reorder_threshold))

        mysql.connection.commit()
        cur.close()

        return redirect(url_for('display_inventory'))

    return render_template('add_item.html')

@app.route('/update_stock/<int:item_id>', methods=['POST'])
def update_stock(item_id):
    if request.method == 'POST':
        new_quantity = request.form['new_quantity']

        cur = mysql.connection.cursor()

        # Update the quantity in the 'inventory' table
        cur.execute('UPDATE inventory SET quantity = %s WHERE id = %s', (new_quantity, item_id))

        mysql.connection.commit()
        cur.close()

        return jsonify({"message": "Stock updated successfully"})
    
@app.route('/delete_item/<int:item_id>', methods=['POST'])
def delete_item(item_id):
    if request.method == 'POST':
        try:
            # Delete the item from the database
            cur = mysql.connection.cursor()
            cur.execute("DELETE FROM inventory WHERE id = %s", (item_id,))
            mysql.connection.commit()
            cur.close()

            return "Item deleted successfully" 
        except Exception as e:
            print("Error deleting item:", str(e))
            return "Failed to delete item", 500  # Return a 500 Internal Server Error status
        
@app.route('/get_inventory_data')
def get_inventory_data():
    try:
        search_query = request.args.get('search', '')  # Retrieve the search query from the request

        if search_query:
            search_cursor = mysql.connection.cursor()
            search = "SELECT id, item_name, quantity, reorder_threshold FROM inventory WHERE item_name LIKE %s"
            search_cursor.execute(search, ('%' + search_query + '%',))
            search_results = search_cursor.fetchall()
            search_cursor.close()

            search_list = [{'id': item[0], 'item_name': item[1], 'quantity': item[2], 'reorder_threshold': item[3]} for item in search_results]

            return jsonify(search_list)
        else:
            cur = mysql.connection.cursor()
            cur.execute("SELECT * FROM inventory")
            inventory_data = cur.fetchall()

            for item in inventory_data:
                if item[2] < item[3]:
                    send_notification(item[1])
            
            inventory_list = [{'id': item[0], 'item_name': item[1], 'quantity': item[2], 'reorder_threshold': item[3]} for item in inventory_data]

            cur.close()
            return jsonify(inventory_list)
    except Exception as e:
        print("Error fetching inventory data:", str(e))
        return jsonify({'error': 'Failed to fetch inventory data'}), 500

def send_notification(item_name):
    notifications.append(f"Stock for {item_name} is below the reorder threshold. Please place an order.")

@app.route('/get_notifications')
def get_notifications():
    # Retrieve and clear notifications
    current_notifications = notifications.copy()
    notifications.clear()

    # Return notifications as JSON
    return jsonify(current_notifications)


if __name__ == '__main__':
    app.run(debug=True)
