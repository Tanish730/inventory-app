import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models.db_models import Product, Customer, Order, OrderItem
from app.models.schemas import ProductCreate, CustomerCreate, OrderCreate, OrderItemCreate
from app import crud

def run_tests():
    # 1. Clean the database (drop and recreate tables for a clean slate)
    print("Resetting database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        print("\n--- Running Integration Tests ---")

        # ----------------------------------------------------
        # TEST 1: Create Initial Customer and Product
        # ----------------------------------------------------
        print("Test 1: Seeding initial data...")
        p1 = crud.create_product(db, ProductCreate(sku="IPHONE15", name="iPhone 15", price=999.99, stock_quantity=10))
        p2 = crud.create_product(db, ProductCreate(sku="MACBOOK16", name="MacBook Pro 16", price=2499.99, stock_quantity=3))
        
        c1 = crud.create_customer(db, CustomerCreate(name="Alice Smith", email="alice@example.com", phone="1234567890"))
        print(f"  Created Products: {p1.name} (Stock: {p1.stock_quantity}), {p2.name} (Stock: {p2.stock_quantity})")
        print(f"  Created Customer: {c1.name} ({c1.email})")

        # ----------------------------------------------------
        # TEST 2: Unique SKU Validation
        # ----------------------------------------------------
        print("\nTest 2: Verifying Unique SKU validation...")
        try:
            crud.create_product(db, ProductCreate(sku="IPHONE15", name="iPhone 15 Fake", price=500.00, stock_quantity=5))
            print("  FAIL: Duplicate SKU was allowed!")
            sys.exit(1)
        except crud.SKUAlreadyExistsException as e:
            print(f"  PASS: Caught expected error: {e}")

        # ----------------------------------------------------
        # TEST 3: Unique Email Validation
        # ----------------------------------------------------
        print("\nTest 3: Verifying Unique Customer Email validation...")
        try:
            crud.create_customer(db, CustomerCreate(name="Alice Clone", email="alice@example.com"))
            print("  FAIL: Duplicate Email was allowed!")
            sys.exit(1)
        except crud.EmailAlreadyExistsException as e:
            print(f"  PASS: Caught expected error: {e}")

        # ----------------------------------------------------
        # TEST 4: Insufficient Stock (Transaction Rollback)
        # ----------------------------------------------------
        print("\nTest 4: Verifying Order with Insufficient Stock (should rollback)...")
        # Alice tries to order 1 iPhone (Available: 10) AND 5 MacBooks (Available: 3).
        # Since MacBook stock is insufficient, the whole order must fail, and iPhone stock MUST NOT decrease.
        order_in = OrderCreate(
            customer_id=c1.id,
            items=[
                OrderItemCreate(product_id=p1.id, quantity=1),  # Valid
                OrderItemCreate(product_id=p2.id, quantity=5)   # Insufficient! (Only 3 available)
            ]
        )
        try:
            crud.create_order(db, order_in)
            print("  FAIL: Order went through despite insufficient stock!")
            sys.exit(1)
        except crud.InsufficientStockException as e:
            print(f"  PASS: Caught expected error: {e}")
            
            # Crucial Check: Verify iPhone stock did NOT decrease from 10!
            db.expire_all() # Refresh SQLAlchemy cache from database
            iphone_db = crud.get_product(db, p1.id)
            macbook_db = crud.get_product(db, p2.id)
            print(f"  Stock verification post-rollback:")
            print(f"    iPhone Stock: {iphone_db.stock_quantity} (Expected: 10)")
            print(f"    MacBook Stock: {macbook_db.stock_quantity} (Expected: 3)")
            
            assert iphone_db.stock_quantity == 10, "iPhone stock decreased despite transaction failure!"
            assert macbook_db.stock_quantity == 3, "MacBook stock modified!"
            print("    Transaction successfully rolled back!")

        # ----------------------------------------------------
        # TEST 5: Successful Order (Stock Reduction)
        # ----------------------------------------------------
        print("\nTest 5: Placing a valid order (should succeed & reduce stock)...")
        # Alice orders 2 iPhones (Available: 10) and 1 MacBook (Available: 3).
        valid_order_in = OrderCreate(
            customer_id=c1.id,
            items=[
                OrderItemCreate(product_id=p1.id, quantity=2),
                OrderItemCreate(product_id=p2.id, quantity=1)
            ]
        )
        order = crud.create_order(db, valid_order_in)
        print(f"  Order placed successfully! ID: {order.id}, Total: ${order.total_amount}")
        
        # Verify Stocks
        db.expire_all()
        iphone_db = crud.get_product(db, p1.id)
        macbook_db = crud.get_product(db, p2.id)
        print(f"  Stock verification post-order:")
        print(f"    iPhone Stock: {iphone_db.stock_quantity} (Expected: 8)")
        print(f"    MacBook Stock: {macbook_db.stock_quantity} (Expected: 2)")
        
        assert iphone_db.stock_quantity == 8, "iPhone stock did not reduce correctly!"
        assert macbook_db.stock_quantity == 2, "MacBook stock did not reduce correctly!"
        print("  PASS: Stocks reduced correctly!")

        print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
