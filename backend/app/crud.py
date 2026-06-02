from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.db_models import Product, Customer, Order, OrderItem
from app.models.schemas import ProductCreate, ProductUpdate, CustomerCreate, CustomerUpdate, OrderCreate

# Custom Exceptions for clean business logic handling in API layer
class SKUAlreadyExistsException(Exception):
    def __init__(self, sku: str):
        self.sku = sku
        super().__init__(f"Product SKU '{sku}' already exists.")

class EmailAlreadyExistsException(Exception):
    def __init__(self, email: str):
        self.email = email
        super().__init__(f"Customer email '{email}' already exists.")

class InsufficientStockException(Exception):
    def __init__(self, product_name: str, sku: str, requested: int, available: int):
        self.product_name = product_name
        self.sku = sku
        self.requested = requested
        self.available = available
        super().__init__(f"Insufficient stock for '{product_name}' (SKU: {sku}). Requested: {requested}, Available: {available}.")


# ==========================================
# PRODUCT CRUD
# ==========================================
def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(Product).filter(Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Product)
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%")
            )
        )
    return query.offset(skip).limit(limit).all()

def create_product(db: Session, product: ProductCreate):
    # Business Rule: Unique Product SKUs
    db_product = get_product_by_sku(db, product.sku)
    if db_product:
        raise SKUAlreadyExistsException(product.sku)
    
    new_product = Product(
        sku=product.sku.strip(),
        name=product.name.strip(),
        price=product.price,
        stock_quantity=product.stock_quantity
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

def update_product(db: Session, product_id: int, product_update: ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    # Business Rule: If SKU is changing, make sure it is unique
    if "sku" in update_data:
        new_sku = update_data["sku"].strip()
        if new_sku != db_product.sku:
            existing = get_product_by_sku(db, new_sku)
            if existing:
                raise SKUAlreadyExistsException(new_sku)
            update_data["sku"] = new_sku

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True


# ==========================================
# CUSTOMER CRUD
# ==========================================
def get_customer(db: Session, customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(Customer).filter(Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
    return query.offset(skip).limit(limit).all()

def create_customer(db: Session, customer: CustomerCreate):
    # Business Rule: Unique Customer Emails
    db_customer = get_customer_by_email(db, customer.email)
    if db_customer:
        raise EmailAlreadyExistsException(customer.email)
    
    new_customer = Customer(
        name=customer.name.strip(),
        email=customer.email.strip().lower(),
        phone=customer.phone.strip() if customer.phone else None
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    
    update_data = customer_update.model_dump(exclude_unset=True)
    
    # Business Rule: If email is changing, make sure it is unique
    if "email" in update_data:
        new_email = update_data["email"].strip().lower()
        if new_email != db_customer.email:
            existing = get_customer_by_email(db, new_email)
            if existing:
                raise EmailAlreadyExistsException(new_email)
            update_data["email"] = new_email

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return False
    db.delete(db_customer)
    db.commit()
    return True


# ==========================================
# ORDER & TRANSACTION CRUD
# ==========================================
def get_order(db: Session, order_id: int):
    return db.query(Order).filter(Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: OrderCreate):
    # 1. Verify Customer Exists
    customer = get_customer(db, order_in.customer_id)
    if not customer:
        raise ValueError(f"Customer with ID {order_in.customer_id} does not exist.")

    # We use a try-except-rollback wrapper to guarantee database transaction safety (Atomicity)
    try:
        total_amount = 0.0
        db_order_items = []
        
        # 2. Iterate through items and perform validations and calculations
        for item in order_in.items:
            # Fetch product (using SELECT ... FOR UPDATE can lock the row in PostgreSQL to prevent race conditions!)
            # For SQLite, it is simple serial access.
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if not product:
                raise ValueError(f"Product with ID {item.product_id} does not exist.")
            
            # Business Rule: Inventory validation
            if product.stock_quantity < item.quantity:
                raise InsufficientStockException(
                    product_name=product.name,
                    sku=product.sku,
                    requested=item.quantity,
                    available=product.stock_quantity
                )
            
            # Business Rule: Automatic stock reduction
            product.stock_quantity -= item.quantity
            
            # Create OrderItem object (linking unit price at the time of purchase)
            db_item = OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price
            )
            db_order_items.append(db_item)
            total_amount += (product.price * item.quantity)
            
        # 3. Create the parent Order object
        db_order = Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount,
            status="completed" # Set to completed since payment/validation is successful
        )
        
        # 4. Associate items with the order.
        # SQLAlchemy will automatically link the foreign keys once the order is committed!
        db_order.items = db_order_items
        
        db.add(db_order)
        db.commit() # Commits all updates (product stock reductions, order, and order items) atomically!
        db.refresh(db_order)
        return db_order
        
    except Exception as e:
        db.rollback() # If ANY exception occurs, undo all stock reductions and DB insertions
        raise e
