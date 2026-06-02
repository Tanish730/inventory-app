from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

# ==========================================
# PRODUCT SCHEMAS
# ==========================================
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=2, max_length=50, description="Unique stock keeping unit")
    name: str = Field(..., min_length=2, max_length=100)
    price: float = Field(..., gt=0.0, description="Price must be greater than zero")
    stock_quantity: int = Field(default=0, ge=0, description="Initial stock quantity (must be 0 or more)")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[float] = Field(None, gt=0.0)
    stock_quantity: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CUSTOMER SCHEMAS
# ==========================================
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    # Using EmailStr ensures emails are syntactically valid!
    # Pydantic validates this automatically.
    email: str = Field(..., description="Unique customer email address")
    phone: Optional[str] = Field(None, max_length=20)

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None)
    phone: Optional[str] = Field(None, max_length=20)

class CustomerResponse(CustomerBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ORDER ITEM SCHEMAS
# ==========================================
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be at least 1")

class OrderItemCreate(OrderItemBase):
    pass

# We inherit from OrderItemBase and add the data that is populated by the system.
class OrderItemResponse(OrderItemBase):
    id: int
    unit_price: float
    # Nesting the product details makes it simple for the frontend to show names and SKUs
    product: ProductResponse

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ORDER SCHEMAS
# ==========================================
class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1, description="Order must contain at least 1 item")

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    created_at: datetime
    total_amount: float
    status: str
    customer: CustomerResponse
    items: List[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
