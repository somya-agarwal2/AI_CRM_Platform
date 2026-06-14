import random
from datetime import datetime, timedelta
import json
from app import create_app
from app.models import db, Customer, Order, OrderItem, Segment

app = create_app()

def generate_seed_data():
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        print("Creating all tables...")
        db.create_all()

        print("Generating 50 Customers...")
        first_names = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Mallory", "Victor", "Peggy", "Trent", "Walter", "Sarah", "John", "Mike", "Emma", "Olivia"]
        last_names = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"]
        cities = ["New York", "London", "Mumbai", "San Francisco", "Delhi", "Toronto", "Sydney", "Berlin", "Paris", "Tokyo"]

        customers = []
        for i in range(50):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            c = Customer(
                first_name=fn,
                last_name=ln,
                email=f"{fn.lower()}.{ln.lower()}.{i}@example.com",
                phone=f"+1555{random.randint(100000, 999999)}",
                city=random.choice(cities),
                total_spent=0.0,
                order_count=0,
                churn_score=random.uniform(0.0, 1.0),
                created_at=datetime.utcnow() - timedelta(days=random.randint(10, 365))
            )
            customers.append(c)
        db.session.add_all(customers)
        db.session.commit()

        print("Generating 200 Orders with OrderItems...")
        products = [
            {"name": "Running Shoes", "category": "Footwear", "price": 120.0},
            {"name": "Leather Jacket", "category": "Apparel", "price": 250.0},
            {"name": "Wireless Earbuds", "category": "Electronics", "price": 150.0},
            {"name": "Yoga Mat", "category": "Fitness", "price": 30.0},
            {"name": "Coffee Maker", "category": "Home", "price": 85.0},
            {"name": "Smart Watch", "category": "Electronics", "price": 300.0},
            {"name": "Denim Jeans", "category": "Apparel", "price": 60.0},
            {"name": "Sunglasses", "category": "Accessories", "price": 110.0},
            {"name": "Backpack", "category": "Accessories", "price": 75.0},
            {"name": "Water Bottle", "category": "Fitness", "price": 25.0}
        ]

        db_customers = Customer.query.all()
        
        for i in range(200):
            customer = random.choice(db_customers)
            order_date = customer.created_at + timedelta(days=random.randint(1, 360))
            if order_date > datetime.utcnow():
                order_date = datetime.utcnow()
                
            order = Order(
                customer_id=customer.id,
                order_number=f"ORD-10{i+1000}",
                amount=0.0,
                order_date=order_date,
                status=random.choice(['completed', 'completed', 'completed', 'processing', 'shipped']),
                channel=random.choice(['online', 'in-store', 'mobile_app'])
            )
            db.session.add(order)
            db.session.flush()

            num_items = random.randint(1, 4)
            order_total = 0.0
            
            for _ in range(num_items):
                prod = random.choice(products)
                qty = random.randint(1, 3)
                item = OrderItem(
                    order_id=order.id,
                    product_name=prod['name'],
                    category=prod['category'],
                    quantity=qty,
                    price=prod['price']
                )
                db.session.add(item)
                order_total += prod['price'] * qty
                
            order.amount = order_total
            
            customer.total_spent += order_total
            customer.order_count += 1
            if not customer.last_purchase_date or order_date > customer.last_purchase_date:
                customer.last_purchase_date = order_date
                
        db.session.commit()

        print("Generating 10 Saved Segments...")
        segments = [
            {"name": "VIP Customers", "desc": "High spenders with high frequency", "filters": {"total_spent_gt": 1000}, "sql": "SELECT id FROM customers WHERE total_spent > 1000"},
            {"name": "Inactive Customers", "desc": "No purchases in last 90 days", "filters": {"last_purchase_days_gt": 90}, "sql": "SELECT id FROM customers WHERE last_purchase_date < datetime('now', '-90 days')"},
            {"name": "Repeat Buyers", "desc": "More than 2 purchases", "filters": {"order_count_gt": 2}, "sql": "SELECT id FROM customers WHERE order_count > 2"},
            {"name": "Churn Risk Customers", "desc": "High churn risk score", "filters": {"churn_score_gt": 0.7}, "sql": "SELECT id FROM customers WHERE churn_score > 0.7"},
            {"name": "High Value Customers", "desc": "LTV above 500", "filters": {"total_spent_gt": 500}, "sql": "SELECT id FROM customers WHERE total_spent > 500"},
            {"name": "Cart Abandoners", "desc": "Added to cart but didn't buy", "filters": {"abandoned_cart": True}, "sql": "SELECT id FROM customers WHERE churn_score > 0.8"},
            {"name": "Recent Buyers", "desc": "Bought in last 30 days", "filters": {"last_purchase_days_lt": 30}, "sql": "SELECT id FROM customers WHERE last_purchase_date > datetime('now', '-30 days')"},
            {"name": "New York Audience", "desc": "Customers in NY", "filters": {"city": "New York"}, "sql": "SELECT id FROM customers WHERE city = 'New York'"},
            {"name": "London Shoppers", "desc": "Customers in London", "filters": {"city": "London"}, "sql": "SELECT id FROM customers WHERE city = 'London'"},
            {"name": "Potential Churn", "desc": "Medium churn score", "filters": {"churn_score_gt": 0.4}, "sql": "SELECT id FROM customers WHERE churn_score > 0.4"}
        ]
        
        for s in segments:
            seg = Segment(
                name=s["name"],
                description=s["desc"],
                filters=json.dumps(s["filters"])
            )
            db.session.add(seg)
        
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    generate_seed_data()
