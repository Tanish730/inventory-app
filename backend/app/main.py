from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import engine, Base, get_db
from app.models import db_models, schemas
from app import crud

# Create database tables automatically if they don't exist.
# This runs on backend startup.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="Backend API for managing products, customers, and order transactions.",
    version="1.0.0"
)

# Configure CORS so the React frontend (running on another port like 5173) can talk to us.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# EXCEPTION HANDLERS
# ==========================================
@app.exception_handler(crud.SKUAlreadyExistsException)
async def sku_already_exists_handler(request: Request, exc: crud.SKUAlreadyExistsException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "code": "SKU_EXISTS"}
    )

@app.exception_handler(crud.EmailAlreadyExistsException)
async def email_already_exists_handler(request: Request, exc: crud.EmailAlreadyExistsException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "code": "EMAIL_EXISTS"}
    )

@app.exception_handler(crud.InsufficientStockException)
async def insufficient_stock_handler(request: Request, exc: crud.InsufficientStockException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": str(exc),
            "code": "INSUFFICIENT_STOCK",
            "product_name": exc.product_name,
            "sku": exc.sku,
            "requested": exc.requested,
            "available": exc.available
        }
    )


# ==========================================
# PRODUCT ENDPOINTS
# ==========================================
@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def read_products(
    search: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return crud.get_products(db=db, skip=skip, limit=limit, search=search)

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return db_product

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    db_product = crud.update_product(db=db, product_id=product_id, product_update=product)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return db_product

@app.delete("/api/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    success = crud.delete_product(db=db, product_id=product_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return {"detail": "Product deleted successfully"}


# ==========================================
# CUSTOMER ENDPOINTS
# ==========================================
@app.post("/api/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db=db, customer=customer)

@app.get("/api/customers", response_model=List[schemas.CustomerResponse])
def read_customers(
    search: Optional[str] = None, 
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return crud.get_customers(db=db, skip=skip, limit=limit, search=search)

@app.get("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return db_customer

@app.put("/api/customers/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = crud.update_customer(db=db, customer_id=customer_id, customer_update=customer)
    if not db_customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return db_customer

@app.delete("/api/customers/{customer_id}", status_code=status.HTTP_200_OK)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    success = crud.delete_customer(db=db, customer_id=customer_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_444_NOT_FOUND, detail="Customer not found")
    return {"detail": "Customer deleted successfully"}


# ==========================================
# ORDER ENDPOINTS
# ==========================================
@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_order(db=db, order_in=order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/api/orders", response_model=List[schemas.OrderResponse])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_orders(db=db, skip=skip, limit=limit)

@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse)
def read_order(order_id: int, db: Session = Depends(get_db)):
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return db_order


# ==========================================
# DASHBOARD / ANALYTICS ENDPOINT
# ==========================================
@app.get("/api/dashboard/stats")
def read_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Total Products
    total_products = db.query(db_models.Product).count()
    
    # 2. Total Inventory Value (Sum of price * stock_quantity)
    products = db.query(db_models.Product).all()
    total_value = sum(p.price * p.stock_quantity for p in products)
    
    # 3. Low Stock Items (Stock <= 5)
    low_stock_items = [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "price": p.price,
            "stock_quantity": p.stock_quantity
        } for p in products if p.stock_quantity <= 5
    ]
    low_stock_count = len(low_stock_items)
    
    # 4. Total Orders and Total Revenue
    orders = db.query(db_models.Order).all()
    total_orders = len(orders)
    total_revenue = sum(o.total_amount for o in orders)
    
    # 5. Total Customers
    total_customers = db.query(db_models.Customer).count()

    return {
        "total_products": total_products,
        "total_value": round(total_value, 2),
        "low_stock_count": low_stock_count,
        "low_stock_items": low_stock_items,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_customers": total_customers
    }
