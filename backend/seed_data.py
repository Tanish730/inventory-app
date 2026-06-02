import requests
import random
import sys

def seed_database(api_url):
    print(f"Seeding data to: {api_url}")
    
    # 1. Create Products
    products = [
        {"name": "Wireless Noise-Cancelling Headphones", "sku": "AUDIO-WH-100", "price": 299.99, "stock_quantity": 45, "description": "Premium over-ear headphones with active noise cancellation."},
        {"name": "Mechanical Gaming Keyboard", "sku": "TECH-KB-M1", "price": 129.50, "stock_quantity": 12, "description": "RGB mechanical keyboard with cherry MX red switches."},
        {"name": "Ultra-Wide 34-inch Monitor", "sku": "DISP-UW-34", "price": 450.00, "stock_quantity": 4, "description": "144Hz curved monitor for gaming and productivity."}, # Low stock!
        {"name": "Ergonomic Office Chair", "sku": "FURN-CH-01", "price": 199.99, "stock_quantity": 25, "description": "Breathable mesh chair with lumbar support."},
        {"name": "USB-C Hub (7-in-1)", "sku": "ACC-HUB-C7", "price": 35.99, "stock_quantity": 100, "description": "Multi-port adapter for modern laptops."}
    ]
    
    print("\n--- Adding Products ---")
    created_products = []
    for p in products:
        response = requests.post(f"{api_url}/api/products", json=p)
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            created_products.append(data)
            print(f"SUCCESS: Added product: {p['name']}")
        else:
            print(f"ERROR: Failed to add {p['name']}: {response.text} (Status: {response.status_code})")
            
    # 2. Create Customers
    customers = [
        {"name": "Acme Corp", "email": "procurement@acmecorp.com", "phone": "555-0101"},
        {"name": "TechStart Inc", "email": "hello@techstart.io", "phone": "555-0202"},
        {"name": "Global Retail LLC", "email": "purchasing@globalretail.net", "phone": "555-0303"}
    ]
    
    print("\n--- Adding Customers ---")
    created_customers = []
    for c in customers:
        response = requests.post(f"{api_url}/api/customers", json=c)
        if response.status_code == 200 or response.status_code == 201:
            data = response.json()
            created_customers.append(data)
            print(f"SUCCESS: Added customer: {c['name']}")
        else:
            print(f"ERROR: Failed to add {c['name']}: {response.text} (Status: {response.status_code})")
            
    # 3. Create Orders
    if created_products and created_customers:
        print("\n--- Generating Orders ---")
        for i in range(5):
            customer = random.choice(created_customers)
            product = random.choice(created_products)
            
            # Request between 1 and 3 items
            qty = random.randint(1, 3)
            
            order_data = {
                "customer_id": customer["id"],
                "product_id": product["id"],
                "quantity": qty
            }
            
            response = requests.post(f"{api_url}/api/orders", json=order_data)
            if response.status_code == 200 or response.status_code == 201:
                print(f"SUCCESS: Created Order: {customer['name']} bought {qty}x {product['name']}")
            else:
                print(f"ERROR: Failed to create order: {response.text} (Status: {response.status_code})")

    print("\n🎉 Seeding complete! Go check your live dashboard.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python seed_data.py <YOUR_BACKEND_API_URL>")
        print("Example: python seed_data.py https://stockflow-backend.onrender.com")
        sys.exit(1)
        
    url = sys.argv[1].rstrip("/")
    seed_database(url)
