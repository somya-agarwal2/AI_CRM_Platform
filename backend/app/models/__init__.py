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
    role = db.Column(db.String(50), default='Marketing Manager') # Admin, Marketing Manager, Analyst
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Customer(db.Model):
    __tablename__ = 'customers'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    city = db.Column(db.String(100))
    total_spent = db.Column(db.Float, default=0.0)
    order_count = db.Column(db.Integer, default=0)
    last_purchase_date = db.Column(db.DateTime)
    churn_score = db.Column(db.Float, default=0.0)
    ai_recommendation = db.Column(db.Text) # JSON string with recommendation details
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    orders = db.relationship('Order', backref='customer', lazy=True, cascade="all, delete-orphan")

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    order_number = db.Column(db.String(50), nullable=False, unique=True)
    amount = db.Column(db.Float, nullable=False)
    order_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default='completed')
    channel = db.Column(db.String(50), default='online')
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")

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
    filters = db.Column(db.Text) # JSON string of rules
    status = db.Column(db.String(50), default='active')
    is_ai = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    customers = db.relationship('Customer', secondary=segment_customers, lazy='subquery', backref=db.backref('segments', lazy=True))

class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    audience_id = db.Column(db.String(36), db.ForeignKey('segments.id'), nullable=True)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=True)
    type = db.Column(db.String(50), default='bulk')
    goal = db.Column(db.String(255))
    offer = db.Column(db.String(255))
    channels = db.Column(db.String(255)) # JSON list string or comma separated
    expected_revenue = db.Column(db.Float, default=0.0)
    confidence_score = db.Column(db.Float, default=0.0)
    open_count = db.Column(db.Integer, default=0)
    click_count = db.Column(db.Integer, default=0)
    status = db.Column(db.String(50), default='Draft') # Draft, Running, Paused, Completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    generated_by = db.Column(db.String(50), default='User') # 'AI' or 'User'
    ai_confidence = db.Column(db.Float, nullable=True)
    creation_source = db.Column(db.String(50), default='Manual') # 'Grok', 'Template', 'Manual'
    messages = db.relationship('CampaignMessage', backref='campaign', lazy=True)
    audience = db.relationship('Segment', backref='campaigns')
    customer = db.relationship('Customer', backref='personal_campaigns')

class CampaignMessage(db.Model):
    __tablename__ = 'campaign_messages'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=False)
    channel = db.Column(db.String(50)) # email, sms, whatsapp
    content = db.Column(db.Text)

class Journey(db.Model):
    __tablename__ = 'journeys'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'))
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=True)
    type = db.Column(db.String(50), default='bulk')
    name = db.Column(db.String(100), nullable=False)
    nodes = db.relationship('JourneyNode', backref='journey', lazy=True)
    customer = db.relationship('Customer', backref='personal_journeys')

class JourneyNode(db.Model):
    __tablename__ = 'journey_nodes'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    journey_id = db.Column(db.String(36), db.ForeignKey('journeys.id'), nullable=False)
    type = db.Column(db.String(50)) # WhatsApp, Email, Wait, Condition, etc.
    config = db.Column(db.Text) # JSON string

class AIOpportunity(db.Model):
    __tablename__ = 'ai_opportunities'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(255))
    reasoning = db.Column(db.Text)
    revenue_at_risk = db.Column(db.Float)
    why_matters = db.Column(db.Text) # JSON list of bullet points
    recommended_action = db.Column(db.String(255))
    expected_recovery = db.Column(db.String(100))
    confidence = db.Column(db.Float)
    status = db.Column(db.String(50), default='pending') # pending, actioned
    linked_campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class DeliveryEvent(db.Model):
    __tablename__ = 'delivery_events'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'))
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'))
    channel = db.Column(db.String(50))
    status = db.Column(db.String(50)) # DELIVERED, FAILED, OPENED, CLICKED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    campaign = db.relationship('Campaign', backref='delivery_events')

class CustomerAction(db.Model):
    __tablename__ = 'customer_actions'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    customer_id = db.Column(db.String(36), db.ForeignKey('customers.id'), nullable=False)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=True)
    action_type = db.Column(db.String(100))
    status = db.Column(db.String(50))
    channel = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AnalyticsSnapshot(db.Model):
    __tablename__ = 'analytics_snapshots'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    revenue = db.Column(db.Float, default=0.0)
    conversions = db.Column(db.Integer, default=0)
    audience_growth = db.Column(db.Integer, default=0)

class AIInsight(db.Model):
    __tablename__ = 'ai_insights'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    entity_type = db.Column(db.String(50), nullable=False) # 'customer', 'segment', 'campaign', 'analytics'
    entity_id = db.Column(db.String(36)) # nullable for 'analytics' summary
    insight_type = db.Column(db.String(50)) # 'churn_prediction', 'explanation', 'opportunity'
    content = db.Column(db.Text) # JSON string with the actual insight
    confidence = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AIAudienceOpportunity(db.Model):
    __tablename__ = 'ai_audience_opportunities'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    segment_name = db.Column(db.String(255))
    reasoning = db.Column(db.Text)
    target_criteria = db.Column(db.Text)
    estimated_customers = db.Column(db.Integer)
    estimated_revenue = db.Column(db.Float)
    confidence_score = db.Column(db.Integer)
    customer_ids = db.Column(db.Text) # JSON array of customer IDs
    status = db.Column(db.String(50), default='pending') # pending, converted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AICampaignOpportunity(db.Model):
    __tablename__ = 'ai_campaign_opportunities'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(255))
    target_segment_name = db.Column(db.String(255))
    target_segment_description = db.Column(db.Text)
    customer_count = db.Column(db.Integer)
    expected_revenue = db.Column(db.Float)
    confidence_score = db.Column(db.Integer)
    reasoning = db.Column(db.Text)
    status = db.Column(db.String(50), default='pending') # pending, converted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CampaignAiInsight(db.Model):
    __tablename__ = 'campaign_ai_insights'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    campaign_id = db.Column(db.String(36), db.ForeignKey('campaigns.id'), nullable=False, unique=True)
    insights_json = db.Column(db.Text)
    next_best_action = db.Column(db.String(255))
    expected_recovery = db.Column(db.String(100))
    recommendations_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Template(db.Model):
    __tablename__ = 'templates'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    thumbnail = db.Column(db.String(255))
    html_content = db.Column(db.Text)
    json_content = db.Column(db.Text)
    usage_count = db.Column(db.Integer, default=0)
    open_rate = db.Column(db.Float, default=0.0)
    click_rate = db.Column(db.Float, default=0.0)
    conversion_rate = db.Column(db.Float, default=0.0)
    revenue_generated = db.Column(db.Float, default=0.0)
    ai_analysis = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = db.Column(db.String(100), default='System')
