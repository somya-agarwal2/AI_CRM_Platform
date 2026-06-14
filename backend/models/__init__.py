from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

segment_customers = db.Table('segment_customers',
    db.Column('segment_id', db.String(36), db.ForeignKey('segments.id'), primary_key=True),
    db.Column('customer_id', db.String(36), db.ForeignKey('customers.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='marketer')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    city = db.Column(db.String(100))
    total_spend = db.Column(db.Float, default=0.0)
    purchase_frequency = db.Column(db.Integer, default=0)
    last_purchase_date = db.Column(db.DateTime)
    preferred_category = db.Column(db.String(50))
    churn_risk_score = db.Column(db.Float, default=0.0)
    loyalty_tier = db.Column(db.String(20), default='Bronze')
    predicted_next_purchase = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    orders = db.relationship('Order', backref='customer', lazy=True)
    messages = db.relationship('Message', backref='customer', lazy=True)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    order_number = db.Column(db.String(50), nullable=False, unique=True)
    amount = db.Column(db.Float, nullable=False)
    order_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='completed')
    channel = db.Column(db.String(50), default='online')
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    order_id = db.Column(db.String(36), db.ForeignKey('orders.id'), nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100))
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)

class Segment(db.Model):
    __tablename__ = 'segments'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    filters = db.Column(db.Text) # JSON string
    query_sql = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    customers = db.relationship('Customer', secondary=segment_customers, lazy='subquery', backref=db.backref('segments', lazy=True))

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    goal = db.Column(db.String(255))
    ai_reasoning = db.Column(db.Text)
    ai_predicted_conversion = db.Column(db.Float)
    journey_flow = db.Column(db.Text)
    status = db.Column(db.String(20), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    messages = db.relationship('Message', backref='campaign', lazy=True)

class CampaignLearning(db.Model):
    __tablename__ = 'campaign_learnings'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'))
    audience_type = db.Column(db.String(100))
    channel = db.Column(db.String(50))
    conversion_rate = db.Column(db.Float)
    revenue_generated = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=False)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    step_number = db.Column(db.Integer, default=1)
    channel = db.Column(db.String(50), nullable=False)
    recipient_address = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending')
    revenue = db.Column(db.Float, default=0.0)
    sent_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    events = db.relationship('CommunicationEvent', backref='message', lazy=True)

class CommunicationEvent(db.Model):
    __tablename__ = 'communication_events'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    message_id = db.Column(db.String(36), db.ForeignKey('messages.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class CampaignAiInsight(db.Model):
    __tablename__ = 'campaign_ai_insights'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=False, unique=True)
    insights_json = db.Column(db.Text)
    next_best_action = db.Column(db.String(255))
    expected_recovery = db.Column(db.String(100))
    recommendations_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AiInsight(db.Model):
    __tablename__ = 'ai_insights'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    type = db.Column(db.String(50))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    details = db.Column(db.Text) # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
